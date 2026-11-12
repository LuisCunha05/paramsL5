import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { logger as loggerFn } from '#/logger';
import { page } from '#gen/page';

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

describe('page function', () => {
  describe('formatting', () => {
    test('should format page correctly', () => {
      input = 3;
      expected = { [QUERY_NAMES.PAG]: '3' };

      result = page(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return empty result if called with a negative number', () => {
      input = -5;
      expected = { [QUERY_NAMES.PAG]: undefined };

      result = page(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if called with 0', () => {
      input = 0;
      expected = { [QUERY_NAMES.PAG]: undefined };

      result = page(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if called with a non-number', () => {
      input = 'invalid';
      expected = { [QUERY_NAMES.PAG]: undefined };

      result = page(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if argument is undefined', () => {
      expected = { [QUERY_NAMES.PAG]: undefined };
      result = page(undefined, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('page logging', () => {
    test('should log error if argument is a negative number', () => {
      input = -5;

      page(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Page: must be a positive integer, got number instead',
      );
    });

    test('should log error if argument is 0', () => {
      input = 0;

      page(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Page: must be a positive integer, got number instead',
      );
    });

    test('should log error if argument is not a number', () => {
      input = 'invalid';

      page(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Page: must be a positive integer, got string instead',
      );
    });

    test('should log info if argument is undefined', () => {
      page(undefined, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith('Page: no value given');
    });
  });
});
