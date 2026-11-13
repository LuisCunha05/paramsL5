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
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';

        expect(() => WithCount.build(input, { logger: noOpLogger })).toThrow(
          ParamsL5ValidationError,
        );
        expect(() => WithCount.build(input, { logger: noOpLogger })).toThrow(
          'withCount: argument must be an array, got string instead',
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.WTC]: undefined };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out non-string items', () => {
        input = ['comments', 123, 'likes'];
        expected = { [QUERY_NAMES.WTC]: 'comments;likes' };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['comments', '', 'likes', '   '];
        expected = { [QUERY_NAMES.WTC]: 'comments;likes' };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return empty result if no values remain after filtering', () => {
        input = [123];
        expected = { [QUERY_NAMES.WTC]: undefined };

        result = WithCount.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('withCount logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => WithCount.build(input, { logger })).toThrow();

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: argument must be an array, got string instead',
        );
      });

      test('should log info if an item is not a string', () => {
        input = ['comments', 123];

        WithCount.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        WithCount.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: no values given',
        );
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        WithCount.build(input, { logger });

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
        }
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

      test('should filter out non-string items', () => {
        input = ['comments', 123, 'likes'];
        expected = {
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['comments', '', 'likes', '   '];
        expected = {
          data: { [QUERY_NAMES.WTC]: 'comments;likes' },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined if no values remain after filtering', () => {
        input = [123];
        expected = {
          data: { [QUERY_NAMES.WTC]: undefined },
          success: true,
        };

        result = WithCount.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('withCount logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        WithCount.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'withCount: argument must be an array, got string instead',
        );
      });

      test('should log info if an item is not a string', () => {
        input = ['comments', 123];

        WithCount.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        WithCount.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'withCount: no values given',
        );
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        WithCount.safe(input, { logger });

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
