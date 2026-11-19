import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { With } from '#gen/with';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
let result: any;
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

describe('With class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format relations correctly', () => {
        input = ['posts', 'comments'];
        expected = { [QUERY_NAMES.WTH]: 'posts;comments' };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['posts', 'comments', 'posts'];
        expected = { [QUERY_NAMES.WTH]: 'posts;comments' };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format relations without options', () => {
        input = ['posts', 'comments'];
        expected = { [QUERY_NAMES.WTH]: 'posts;comments' };

        result = With.build(input);

        expect(result).toEqual(expected);
      });

      test('should format a single relation without trailing delimiter', () => {
        input = ['posts'];
        expected = { [QUERY_NAMES.WTH]: 'posts' };

        result = With.build(input);

        expect(result).toEqual(expected);
      });

      test('should format pipe and dot notation relation paths with generic shape', () => {
        interface User {
          posts: { id: string; title: string }[];
          comments: { body: string }[];
        }

        result = With.build<User>([
          'posts|title',
          'posts:id|title',
          'comments',
        ]);

        expect(result).toEqual({
          [QUERY_NAMES.WTH]: 'posts|title;posts:id|title;comments',
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';
        let caught: unknown;

        try {
          With.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.WTH);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'with: argument must be an array, got string instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.WTH,
              message: 'with: argument must be an array, got string instead',
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
          With.build(value as never, { logger: noOpLogger }),
        ).toThrow(`with: argument must be an array, got ${type} instead`);
      });

      test('should return empty result if called with undefined or no arguments', () => {
        expected = { [QUERY_NAMES.WTH]: undefined };

        expect(With.build()).toEqual(expected);
        expect(With.build(undefined, { logger: noOpLogger })).toEqual(expected);
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.WTH]: undefined };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with issues for non-string or empty/whitespace items by default', () => {
        input = ['posts', 123, '', '   ', null, 'comments'];
        let caught: unknown;

        try {
          With.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.issues.map((issue) => issue.field)).toEqual([
            'with[1]',
            'with[2]',
            'with[3]',
            'with[4]',
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = [
          'posts',
          123,
          null,
          undefined,
          {},
          'comments',
          '',
          '   ',
          '\t\n',
        ];
        expected = { [QUERY_NAMES.WTH]: 'posts;comments' };

        result = With.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return empty result when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = { [QUERY_NAMES.WTH]: undefined };

        result = With.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('with logging', () => {
      test('should not log anything for valid values', () => {
        With.build(['posts', 'comments'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => With.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: argument must be an array, got string instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error if argument is null', () => {
        expect(() => With.build(null as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and value is not a non-empty string', () => {
        input = ['posts', 123];

        expect(() => With.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and value is not a string', () => {
        input = ['posts', 123];

        With.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and value is an empty or whitespace-only string', () => {
        input = ['posts', '   '];

        With.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got empty string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        With.build(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('with: no values given');
      });

      test('should log info with empty array', () => {
        input = [];

        With.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('with: no values given');
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        With.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'with: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'with: no values remaining to parse',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format relations correctly', () => {
        input = ['posts', 'comments'];
        expected = {
          data: { [QUERY_NAMES.WTH]: 'posts;comments' },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['posts', 'comments', 'posts'];
        expected = {
          data: { [QUERY_NAMES.WTH]: 'posts;comments' },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format relations without options', () => {
        input = ['posts', 'comments'];
        expected = {
          data: { [QUERY_NAMES.WTH]: 'posts;comments' },
          success: true,
        };

        result = With.safe(input);

        expect(result).toEqual(expected);
      });

      test('should format pipe and dot notation relation paths with generic shape', () => {
        interface User {
          posts: { id: string; title: string }[];
          comments: { body: string }[];
        }

        result = With.safe<User>(['posts|title', 'posts:id|title', 'comments']);

        expect(result).toEqual({
          data: { [QUERY_NAMES.WTH]: 'posts|title;posts:id|title;comments' },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return failure result if called with a non-array', () => {
        input = 'not an array';

        result = With.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.WTH);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'with: argument must be an array, got string instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.WTH,
              message: 'with: argument must be an array, got string instead',
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
          result = With.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.WTH);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `with: argument must be an array, got ${type} instead`,
            );
          }
        },
      );

      test('should return success result with undefined if called with undefined or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.WTH]: undefined },
          success: true,
        };

        expect(With.safe()).toEqual(expected);
        expect(With.safe(undefined, { logger: noOpLogger })).toEqual(expected);
      });

      test('should return success result with undefined if called with an empty array', () => {
        input = [];
        expected = {
          data: { [QUERY_NAMES.WTH]: undefined },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return failure result for invalid array items under strict mode', () => {
        input = ['posts', 123, '   '];

        const safeResult = With.safe(input, { logger: noOpLogger });

        expect(safeResult.success).toBe(false);
        if (!safeResult.success) {
          expect(safeResult.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(safeResult.error.issues.map((issue) => issue.field)).toEqual([
            'with[1]',
            'with[2]',
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = [
          'posts',
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
          data: { [QUERY_NAMES.WTH]: 'posts;comments' },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = {
          data: { [QUERY_NAMES.WTH]: undefined },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('with logging', () => {
      test('should not log anything for valid values', () => {
        With.safe(['posts', 'comments'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        With.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: argument must be an array, got string instead',
        );
      });

      test('should log error if argument is null', () => {
        With.safe(null as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and value is not a non-empty string', () => {
        input = ['posts', 123];

        With.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and value is not a string', () => {
        input = ['posts', 123];

        With.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and value is an empty or whitespace-only string', () => {
        input = ['posts', '   '];

        With.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got empty string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        With.safe(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('with: no values given');
      });

      test('should log info with empty array', () => {
        input = [];

        With.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('with: no values given');
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        With.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'with: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'with: no values remaining to parse',
        );
      });
    });
  });
});
