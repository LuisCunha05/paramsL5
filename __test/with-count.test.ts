import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { WithCount } from '#gen/with-count';

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

describe('WithCount class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format relations correctly', () => {
        input = ['comments', 'likes'];
        expected = { [QUERY_NAMES.WTC]: 'comments;likes' };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['comments', 'likes', 'comments'];
        expected = { [QUERY_NAMES.WTC]: 'comments;likes' };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format relations without options', () => {
        input = ['comments', 'likes'];
        expected = { [QUERY_NAMES.WTC]: 'comments;likes' };

        result = WithCount.build(input);

        expect(result).toEqual(expected);
      });

      test('should format a single relation without trailing delimiter', () => {
        input = ['comments'];
        expected = { [QUERY_NAMES.WTC]: 'comments' };

        result = WithCount.build(input);

        expect(result).toEqual(expected);
      });

      test('should format nested dot-notation relations with generic shape', () => {
        interface Post {
          comments: { replies: { id: string }[] }[];
          likes: { id: string }[];
        }

        result = WithCount.build<Post>(['comments', 'likes']);

        expect(result).toEqual({
          [QUERY_NAMES.WTC]: 'comments;likes',
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';
        let caught: unknown;

        try {
          WithCount.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.WTC);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'withCount: argument must be an array, got string instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.WTC,
              message:
                'withCount: argument must be an array, got string instead',
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
          WithCount.build(value as never, { logger: noOpLogger }),
        ).toThrow(`withCount: argument must be an array, got ${type} instead`);
      });

      test('should return empty result if called with undefined or no arguments', () => {
        expected = { [QUERY_NAMES.WTC]: undefined };

        expect(WithCount.build()).toEqual(expected);
        expect(WithCount.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.WTC]: undefined };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with issues for non-string or empty/whitespace items by default', () => {
        input = ['comments', 123, '', '   ', null, 'likes'];
        let caught: unknown;

        try {
          WithCount.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.issues.map((issue) => issue.field)).toEqual([
            'withCount[1]',
            'withCount[2]',
            'withCount[3]',
            'withCount[4]',
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = [
          'comments',
          123,
          null,
          undefined,
          {},
          'likes',
          '',
          '   ',
          '\t\n',
        ];
        expected = { [QUERY_NAMES.WTC]: 'comments;likes' };

        result = WithCount.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return empty result when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = { [QUERY_NAMES.WTC]: undefined };

        result = WithCount.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('withCount logging', () => {
      test('should not log anything for valid values', () => {
        WithCount.build(['comments', 'likes'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => WithCount.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: argument must be an array, got string instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error if argument is null', () => {
        expect(() => WithCount.build(null as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and an item is not a non-empty string', () => {
        input = ['comments', 123];

        expect(() => WithCount.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is not a string', () => {
        input = ['comments', 123];

        WithCount.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is an empty or whitespace-only string', () => {
        input = ['comments', '   '];

        WithCount.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        WithCount.build(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: no values given',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        WithCount.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: no values given',
        );
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        WithCount.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'withCount: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'withCount: no values remaining to parse',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format relations correctly', () => {
        input = ['comments', 'likes'];
        expected = {
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['comments', 'likes', 'comments'];
        expected = {
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format relations without options', () => {
        input = ['comments', 'likes'];
        expected = {
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        };

        result = WithCount.safe(input);

        expect(result).toEqual(expected);
      });

      test('should format nested dot-notation relations with generic shape', () => {
        interface Post {
          comments: { replies: { id: string }[] }[];
          likes: { id: string }[];
        }

        result = WithCount.safe<Post>(['comments', 'likes']);

        expect(result).toEqual({
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return failure result if called with a non-array', () => {
        input = 'not an array';

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.WTC);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'withCount: argument must be an array, got string instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.WTC,
              message:
                'withCount: argument must be an array, got string instead',
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
          result = WithCount.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.WTC);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `withCount: argument must be an array, got ${type} instead`,
            );
          }
        },
      );

      test('should return success result with undefined if called with undefined or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.WTC]: undefined },
          success: true,
        };

        expect(WithCount.safe()).toEqual(expected);
        expect(WithCount.safe(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return success result with undefined if called with an empty array', () => {
        input = [];
        expected = {
          data: { [QUERY_NAMES.WTC]: undefined },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return failure result for invalid array items under strict mode', () => {
        input = ['comments', 123, '   '];

        const safeResult = WithCount.safe(input, { logger: noOpLogger });

        expect(safeResult.success).toBe(false);
        if (!safeResult.success) {
          expect(safeResult.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(safeResult.error.issues.map((issue) => issue.field)).toEqual([
            'withCount[1]',
            'withCount[2]',
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = [
          'comments',
          123,
          null,
          undefined,
          {},
          'likes',
          '',
          '   ',
          '\t\n',
        ];
        expected = {
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = {
          data: { [QUERY_NAMES.WTC]: undefined },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('withCount logging', () => {
      test('should not log anything for valid values', () => {
        WithCount.safe(['comments', 'likes'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        WithCount.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: argument must be an array, got string instead',
        );
      });

      test('should log error if argument is null', () => {
        WithCount.safe(null as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and an item is not a non-empty string', () => {
        input = ['comments', 123];

        WithCount.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is not a string', () => {
        input = ['comments', 123];

        WithCount.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is an empty or whitespace-only string', () => {
        input = ['comments', '   '];

        WithCount.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        WithCount.safe(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: no values given',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        WithCount.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: no values given',
        );
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        WithCount.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'withCount: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'withCount: no values remaining to parse',
        );
      });
    });
  });
});
