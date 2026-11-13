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
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';

        expect(() => Filter.build(input, { logger: noOpLogger })).toThrow(
          ParamsL5ValidationError,
        );
        expect(() => Filter.build(input, { logger: noOpLogger })).toThrow(
          'filter: argument must be an array, got string instead',
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.FLT]: undefined };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out non-string items', () => {
        input = ['a', 123, 'b'];
        expected = { [QUERY_NAMES.FLT]: 'a;b' };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['a', '', 'b', '   '];
        expected = { [QUERY_NAMES.FLT]: 'a;b' };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return empty result if no values remain after filtering', () => {
        input = [123];
        expected = { [QUERY_NAMES.FLT]: undefined };

        result = Filter.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('filter logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => Filter.build(input, { logger })).toThrow();

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: argument must be an array, got string instead',
        );
      });

      test('should log info if an item is not a string', () => {
        input = ['a', 123];

        Filter.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        Filter.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('filter: no values given');
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        Filter.build(input, { logger });

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
        }
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

      test('should filter out non-string items', () => {
        input = ['a', 123, 'b'];
        expected = {
          data: { [QUERY_NAMES.FLT]: 'a;b' },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['a', '', 'b', '   '];
        expected = {
          data: { [QUERY_NAMES.FLT]: 'a;b' },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined if no values remain after filtering', () => {
        input = [123];
        expected = {
          data: { [QUERY_NAMES.FLT]: undefined },
          success: true,
        };

        result = Filter.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('filter logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        Filter.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'filter: argument must be an array, got string instead',
        );
      });

      test('should log info if an item is not a string', () => {
        input = ['a', 123];

        Filter.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'filter: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        Filter.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('filter: no values given');
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        Filter.safe(input, { logger });

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
