import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/params-l5-validation-error';
import { logger as loggerFn } from '#/logger';
import { Include } from '#gen/include';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any;

beforeEach(() => {
  input = undefined;
  result = undefined;
  expected = undefined;
});

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const logger = { info, warn, error };
const noOpLogger = loggerFn();

afterEach(() => {
  vi.clearAllMocks();
});

describe('Include class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format include relations correctly', () => {
        input = ['author', 'comments'];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['author', 'comments', 'author'];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format include relations without options', () => {
        input = ['author', 'comments'];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input);

        expect(result).toEqual(expected);
      });

      test('should format a single relation without trailing delimiter', () => {
        input = ['author'];
        expected = { [QUERY_NAMES.INC]: 'author' };

        result = Include.build(input);

        expect(result).toEqual(expected);
      });

      test('should format nested dot-notation relations with generic shape', () => {
        interface Post {
          author: { profile: { avatar: string } };
          comments: { id: string };
        }

        result = Include.build<Post>(['author.profile', 'comments']);

        expect(result).toEqual({
          [QUERY_NAMES.INC]: 'author.profile,comments',
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';
        let caught: unknown;

        try {
          Include.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.INC);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'include: argument must be an array, got string instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.INC,
              message: 'include: argument must be an array, got string instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'null', value: null, type: 'null' },
        { label: 'number', value: 123, type: 'number' },
        { label: 'object', value: {}, type: 'object' },
      ])('should throw error if called with $label', ({ value, type }) => {
        expect(() =>
          Include.build(value as never, { logger: noOpLogger }),
        ).toThrow(`include: argument must be an array, got ${type} instead`);
      });

      test('should return empty result if called with undefined or no arguments', () => {
        expected = { [QUERY_NAMES.INC]: undefined };

        expect(Include.build()).toEqual(expected);
        expect(Include.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.INC]: undefined };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with issues for non-string or empty/whitespace items by default', () => {
        input = ['author', 123, '', '   ', null, 'comments'];
        let caught: unknown;

        try {
          Include.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.issues.map((issue) => issue.field)).toEqual([
            'include[1]',
            'include[2]',
            'include[3]',
            'include[4]',
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = [
          'author',
          123,
          null,
          undefined,
          {},
          'comments',
          '',
          '   ',
          '\t\n',
        ];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return empty result when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = { [QUERY_NAMES.INC]: undefined };

        result = Include.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('include logging', () => {
      test('should not log anything for valid values', () => {
        Include.build(['author', 'comments'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => Include.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: argument must be an array, got string instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error if argument is null', () => {
        expect(() => Include.build(null as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and an item is not a non-empty string', () => {
        input = ['author', 123];

        expect(() => Include.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is not a string', () => {
        input = ['author', 123];

        Include.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is an empty or whitespace-only string', () => {
        input = ['author', '   '];

        Include.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got empty string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        Include.build(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: no values given',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        Include.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: no values given',
        );
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        Include.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'include: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'include: no values remaining to parse',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format include relations correctly', () => {
        input = ['author', 'comments'];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['author', 'comments', 'author'];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format include relations without options', () => {
        input = ['author', 'comments'];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input);

        expect(result).toEqual(expected);
      });

      test('should format nested dot-notation relations with generic shape', () => {
        interface Post {
          author: { profile: { avatar: string } };
          comments: { id: string };
        }

        result = Include.safe<Post>(['author.profile', 'comments']);

        expect(result).toEqual({
          data: { [QUERY_NAMES.INC]: 'author.profile,comments' },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return failure result if called with a non-array', () => {
        input = 'not an array';

        result = Include.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.INC);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'include: argument must be an array, got string instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.INC,
              message: 'include: argument must be an array, got string instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'null', value: null, type: 'null' },
        { label: 'number', value: 123, type: 'number' },
        { label: 'object', value: {}, type: 'object' },
      ])(
        'should return failure result if called with $label',
        ({ value, type }) => {
          result = Include.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.INC);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `include: argument must be an array, got ${type} instead`,
            );
          }
        },
      );

      test('should return success result with undefined if called with undefined or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.INC]: undefined },
          success: true,
        };

        expect(Include.safe()).toEqual(expected);
        expect(Include.safe(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return success result with undefined if called with an empty array', () => {
        input = [];
        expected = {
          data: { [QUERY_NAMES.INC]: undefined },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return failure result for invalid array items under strict mode', () => {
        input = ['author', 123, '   '];

        const safeResult = Include.safe(input, { logger: noOpLogger });

        expect(safeResult.success).toBe(false);
        if (!safeResult.success) {
          expect(safeResult.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(safeResult.error.issues.map((issue) => issue.field)).toEqual([
            'include[1]',
            'include[2]',
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = [
          'author',
          123,
          null,
          undefined,
          {},
          'comments',
          '',
          '   ',
          '\t\n',
        ];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = {
          data: { [QUERY_NAMES.INC]: undefined },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('include logging', () => {
      test('should not log anything for valid values', () => {
        Include.safe(['author', 'comments'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        Include.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: argument must be an array, got string instead',
        );
      });

      test('should log error if argument is null', () => {
        Include.safe(null as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and an item is not a non-empty string', () => {
        input = ['author', 123];

        Include.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is not a string', () => {
        input = ['author', 123];

        Include.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is an empty or whitespace-only string', () => {
        input = ['author', '   '];

        Include.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got empty string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        Include.safe(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: no values given',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        Include.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: no values given',
        );
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        Include.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'include: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'include: no values remaining to parse',
        );
      });
    });
  });
});
