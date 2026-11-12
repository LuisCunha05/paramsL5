import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { limit } from '#gen/limit';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('limit function', () => {
  describe('formatting', () => {
    test('should set limit to a parameter', () => {
      input = 7;
      expected = { [QUERY_NAMES.LMT]: '7' };

      result = limit(input);

      expect(result).toEqual(expected);
    });

    test('should return empty result with no input', () => {
      expected = { [QUERY_NAMES.LMT]: undefined };
      result = limit(undefined);

      expect(result).toEqual(expected);
    });

    test('should return defaultValue with no input', () => {
      input = 6;
      expected = { [QUERY_NAMES.LMT]: `${input}` };
      result = limit(undefined, { defaultValue: input });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return empty result if called with a negative number', () => {
      input = -10;
      expected = { [QUERY_NAMES.LMT]: undefined };
      result = limit(input);

      expect(result).toEqual(expected);
    });

    test('should return empty result if called with a non-number', () => {
      input = null;
      expected = { [QUERY_NAMES.LMT]: undefined };
      result = limit(input);

      expect(result).toEqual(expected);
    });
  });

  describe('Limit logging', () => {
    test('should log error if argument is a negative number', () => {
      input = -10;
      limit(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Limit: must be a positive integer or zero, got number instead',
      );
    });

    test('should log info if argument is null', () => {
      input = null;
      limit(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith('Limit: no value given');
    });

    test('should log error if argument is an object', () => {
      input = {};
      limit(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Limit: must be a positive integer or zero, got object instead',
      );
    });

    test('should log error if argument is an array', () => {
      input = [];
      limit(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Limit: must be a positive integer or zero, got Array instead',
      );
    });

    test('should log error if argument is NaN', () => {
      input = NaN;
      limit(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Limit: must be a positive integer or zero, got NaN instead',
      );
    });

    test('should log info if argument is undefined', () => {
      limit(undefined, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith('Limit: no value given');
    });
  });
});
