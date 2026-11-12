import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { logger as loggerFn } from '#/logger';
import { withCount } from '#gen/with-count';

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

describe('withCount function', () => {
  describe('formatting', () => {
    test('should format relations correctly', () => {
      input = ['posts', 'comments'];
      expected = { [QUERY_NAMES.WTC]: 'posts;comments' };

      result = withCount(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return unique values if there are duplicates', () => {
      input = ['posts', 'comments', 'posts'];
      expected = { [QUERY_NAMES.WTC]: 'posts;comments' };

      result = withCount(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return empty result if called with a non-array', () => {
      input = 'not an array';
      expected = { [QUERY_NAMES.WTC]: undefined };

      result = withCount(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if called with an empty array', () => {
      input = [];
      expected = { [QUERY_NAMES.WTC]: undefined };

      result = withCount(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if no values remain after filtering', () => {
      input = [123];
      expected = { [QUERY_NAMES.WTC]: undefined };

      result = withCount(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('withCount logging', () => {
    test('should log error if argument is not an array', () => {
      input = 'not an array';

      withCount(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'WithCount: argument must be an array, got string instead',
      );
    });

    test('should log warn if value is not a string', () => {
      input = ['posts', 123];

      withCount(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WithCount: value must be a string, got number instead',
      );
    });

    test('should log info with empty array', () => {
      input = [];

      withCount(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith(
        'WithCount: no values given',
      );
    });

    test('should log info with no values remaining to parse', () => {
      input = [123];

      withCount(input, { logger });

      expect(info).toHaveBeenCalledOnce();
      expect(warn).toHaveBeenCalledOnce();
      expect(warn).toHaveBeenCalledWith(
        'WithCount: value must be a string, got number instead',
      );
      expect(info).toHaveBeenCalledWith(
        'WithCount: no values remaining to parse',
      );
    });
  });
});
