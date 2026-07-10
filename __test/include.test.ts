import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { LOG_LEVEL, URL_ENCODED_CHARS as URC } from '@/constants';
import { include } from '@/generators/include';
import { Logger } from '@/logger';
import type { TResult } from '@/types';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
let result: TResult | undefined;
let expected: TResult | undefined;

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

describe('include function', () => {
  describe('formatting', () => {
    test('should format include relations correctly', () => {
      input = ['author', 'comments'];
      expected = {
        raw: 'author,comments',
        encoded: `author${URC.COMMA}comments`,
      };

      result = include(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return undefined if called with a non-array', () => {
      input = 'not an array';

      result = include(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if called with an empty array', () => {
      input = [];

      result = include(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if no values remain after filtering', () => {
      input = [123];

      result = include(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });
  });

  describe('include logging', () => {
    test('should log error if argument is not an array', () => {
      input = 'not an array';

      include(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Include: argument must be an array, got string instead',
      );
    });

    test('should log info if value is not a string', () => {
      input = ['author', 123];

      include(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith(
        'Include: include value must be a string, got number instead',
      );
    });

    test('should log info with empty array', () => {
      input = [];

      include(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith('Include: no values given');
    });

    test('should log info with no values remaining to parse', () => {
      input = [123];

      include(input, { logger });

      expect(info).toHaveBeenCalledTimes(2);
      expect(info).toHaveBeenNthCalledWith(
        1,
        'Include: include value must be a string, got number instead',
      );
      expect(info).toHaveBeenNthCalledWith(
        2,
        'Include: no values remaining to parse',
      );
    });
  });
});
