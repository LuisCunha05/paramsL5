import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { LOG_LEVEL } from '@/constants';
import { page } from '@/generators/page';
import { Logger } from '@/logger';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
let result: string | undefined;
let expected: string | undefined;

beforeEach(() => {
  input = undefined;
  result = undefined;
  expected = undefined;
});

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const logger = { info, warn, error };
const noOpLogger = Logger({ logLevel: LOG_LEVEL.NONE });

afterEach(() => {
  vi.clearAllMocks();
});

describe('page function', () => {
  describe('formatting', () => {
    test('should format page correctly', () => {
      input = 3;
      expected = '3';

      result = page(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return undefined if called with a negative number', () => {
      input = -5;

      result = page(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if called with 0', () => {
      input = 0;

      result = page(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if called with a non-number', () => {
      input = 'invalid';

      result = page(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if argument is undefined', () => {
      result = page(undefined, { logger: noOpLogger });

      expect(result).toBeUndefined();
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
