import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { Filter } from '#gen/filter';

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

describe('Filter class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format a valid array of strings', () => {
        input = ['a', 'b', 'c'];
        expected = { [QUERY_NAMES.FLT]: 'a;b;c' };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['a', 'b', 'a', 'c', 'b'];
        expected = { [QUERY_NAMES.FLT]: 'a;b;c' };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format a valid array without options', () => {
        input = ['id', 'name'];
        expected = { [QUERY_NAMES.FLT]: 'id;name' };

        result = Filter.build(input);

        expect(result).toEqual(expected);
      });

      test('should format a single valid value without trailing delimiter', () => {
        input = ['id'];
        expected = { [QUERY_NAMES.FLT]: 'id' };

        result = Filter.build(input);

        expect(result).toEqual(expected);
      });

      test('should format nested dot-notation paths with generic shape', () => {
        interface User {
          id: string;
          profile: { avatar: string };
        }

        result = Filter.build<User>(['id', 'profile.avatar']);

        expect(result).toEqual({ [QUERY_NAMES.FLT]: 'id;profile.avatar' });
      });
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';
        let caught: unknown;

        try {
          Filter.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.FLT);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'filter: argument must be an array, got string instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.FLT,
              message: 'filter: argument must be an array, got string instead',
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
          Filter.build(value as never, { logger: noOpLogger }),
        ).toThrow(`filter: argument must be an array, got ${type} instead`);
      });

      test('should return empty result if called with undefined or no arguments', () => {
        expected = { [QUERY_NAMES.FLT]: undefined };

        expect(Filter.build()).toEqual(expected);
        expect(Filter.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.FLT]: undefined };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with issues for non-string or empty/whitespace items by default', () => {
        input = ['a', 123, '', '   ', null, 'b'];
        let caught: unknown;

        try {
          Filter.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.issues).toEqual([
            {
              field: 'filter[1]',
              message: 'filter: value must be a string, got number instead',
              value: 123,
            },
            {
              field: 'filter[2]',
              message:
                'filter: value must be a string, got empty string instead',
              value: '',
            },
            {
              field: 'filter[3]',
              message:
                'filter: value must be a string, got empty string instead',
              value: '   ',
            },
            {
              field: 'filter[4]',
              message: 'filter: value must be a string, got null instead',
              value: null,
            },
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = ['a', 123, null, undefined, {}, 'b', '', '   ', '\t\n'];
        expected = { [QUERY_NAMES.FLT]: 'a;b' };

        result = Filter.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return empty result when strict is false and no values remain after filtering', () => {
        input = [123, '', '   ', null];
        expected = { [QUERY_NAMES.FLT]: undefined };

        result = Filter.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('filter logging', () => {
      test('should not log anything for valid values', () => {
        Filter.build(['a', 'b'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => Filter.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: argument must be an array, got string instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error if argument is null', () => {
        expect(() => Filter.build(null as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and an item is not a non-empty string', () => {
        input = ['a', 123];

        expect(() => Filter.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is not a string', () => {
        input = ['a', 123];

        Filter.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is an empty or whitespace-only string', () => {
        input = ['a', '   '];

        Filter.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got empty string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        Filter.build(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('filter: no values given');
      });

      test('should log info with empty array', () => {
        input = [];

        Filter.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('filter: no values given');
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        Filter.build(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'filter: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'filter: no values remaining to parse',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format a valid array of strings', () => {
        input = ['a', 'b', 'c'];
        expected = {
          data: { [QUERY_NAMES.FLT]: 'a;b;c' },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['a', 'b', 'a', 'c', 'b'];
        expected = {
          data: { [QUERY_NAMES.FLT]: 'a;b;c' },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format a valid array without options', () => {
        input = ['id', 'name'];
        expected = {
          data: { [QUERY_NAMES.FLT]: 'id;name' },
          success: true,
        };

        result = Filter.safe(input);

        expect(result).toEqual(expected);
      });

      test('should format nested dot-notation paths with generic shape', () => {
        interface User {
          id: string;
          profile: { avatar: string };
        }

        result = Filter.safe<User>(['id', 'profile.avatar']);

        expect(result).toEqual({
          data: { [QUERY_NAMES.FLT]: 'id;profile.avatar' },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return failure result if called with a non-array', () => {
        input = 'not an array';

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.FLT);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'filter: argument must be an array, got string instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.FLT,
              message: 'filter: argument must be an array, got string instead',
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
          result = Filter.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.FLT);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `filter: argument must be an array, got ${type} instead`,
            );
          }
        },
      );

      test('should return success result with undefined if called with undefined or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.FLT]: undefined },
          success: true,
        };

        expect(Filter.safe()).toEqual(expected);
        expect(Filter.safe(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return success result with undefined if called with an empty array', () => {
        input = [];
        expected = {
          data: { [QUERY_NAMES.FLT]: undefined },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return failure result for invalid array items under strict mode', () => {
        input = ['a', 123, '   '];

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.issues).toEqual([
            {
              field: 'filter[1]',
              message: 'filter: value must be a string, got number instead',
              value: 123,
            },
            {
              field: 'filter[2]',
              message:
                'filter: value must be a string, got empty string instead',
              value: '   ',
            },
          ]);
        }
      });

      test('should filter out invalid items when strict is false', () => {
        input = ['a', 123, null, undefined, {}, 'b', '', '   ', '\t\n'];
        expected = {
          data: { [QUERY_NAMES.FLT]: 'a;b' },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined when strict is false and no values remain', () => {
        input = [123, '', '   ', null];
        expected = {
          data: { [QUERY_NAMES.FLT]: undefined },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });
    });

    describe('filter logging', () => {
      test('should not log anything for valid values', () => {
        Filter.safe(['a', 'b'], { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log error if argument is not an array', () => {
        input = 'not an array';

        Filter.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: argument must be an array, got string instead',
        );
      });

      test('should log error if argument is null', () => {
        Filter.safe(null as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: argument must be an array, got null instead',
        );
      });

      test('should log error when strict is true and an item is not a non-empty string', () => {
        input = ['a', 123];

        Filter.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is not a string', () => {
        input = ['a', 123];

        Filter.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got number instead',
        );
      });

      test('should log info when strict is false and an item is an empty or whitespace-only string', () => {
        input = ['a', '   '];

        Filter.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got empty string instead',
        );
      });

      test('should log info when called with undefined or no arguments', () => {
        Filter.safe(undefined, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('filter: no values given');
      });

      test('should log info with empty array', () => {
        input = [];

        Filter.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('filter: no values given');
      });

      test('should log info with no values remaining to parse when strict is false', () => {
        input = [123];

        Filter.safe(input, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'filter: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'filter: no values remaining to parse',
        );
      });
    });
  });
});
