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
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';

        expect(() => With.build(input, { logger: noOpLogger })).toThrow(
          ParamsL5ValidationError,
        );
        expect(() => With.build(input, { logger: noOpLogger })).toThrow(
          'with: argument must be an array, got string instead',
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.WTH]: undefined };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out non-string items', () => {
        input = ['posts', 123, 'comments'];
        expected = { [QUERY_NAMES.WTH]: 'posts;comments' };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['posts', '', 'comments', '   '];
        expected = { [QUERY_NAMES.WTH]: 'posts;comments' };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return empty result if no values remain after filtering', () => {
        input = [123];
        expected = { [QUERY_NAMES.WTH]: undefined };

        result = With.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('with logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => With.build(input, { logger })).toThrow();

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: argument must be an array, got string instead',
        );
      });

      test('should log info if value is not a string', () => {
        input = ['posts', 123];

        With.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        With.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('with: no values given');
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        With.build(input, { logger });

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
        }
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

      test('should filter out non-string items', () => {
        input = ['posts', 123, 'comments'];
        expected = {
          data: { [QUERY_NAMES.WTH]: 'posts;comments' },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['posts', '', 'comments', '   '];
        expected = {
          data: { [QUERY_NAMES.WTH]: 'posts;comments' },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined if no values remain after filtering', () => {
        input = [123];
        expected = {
          data: { [QUERY_NAMES.WTH]: undefined },
          success: true,
        };

        result = With.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('with logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        With.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'with: argument must be an array, got string instead',
        );
      });

      test('should log info if value is not a string', () => {
        input = ['posts', 123];

        With.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'with: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        With.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith('with: no values given');
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        With.safe(input, { logger });

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
