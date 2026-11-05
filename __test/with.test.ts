import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { LOG_LEVEL } from '@/constants';
import { withRel } from '@/generators/with';
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

describe('withRel function', () => {
  describe('formatting', () => {
    test('should format relations correctly', () => {
      input = ['posts', 'comments'];
      expected = 'posts;comments';

      result = withRel(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return undefined if called with a non-array', () => {
      input = 'not an array';

      result = withRel(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if called with an empty array', () => {
      input = [];

      result = withRel(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test('should return undefined if no values remain after filtering', () => {
      input = [123];

      result = withRel(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });
  });

  describe('withRel logging', () => {
    test('should log error if argument is not an array', () => {
      input = 'not an array';

      withRel(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'With: argument must be an array, got string instead',
      );
    });

    test('should log info if value is not a string', () => {
      input = ['posts', 123];

      withRel(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'With: value must be a string, got number instead',
      );
    });

    test('should log info with empty array', () => {
      input = [];

      withRel(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith('With: no values given');
    });

    test('should log info with no values remaining to parse', () => {
      input = [123];

      withRel(input, { logger });

      expect(info).toHaveBeenCalledOnce();
      expect(warn).toHaveBeenCalledOnce();
      expect(warn).toHaveBeenCalledWith(
        'With: value must be a string, got number instead',
      );
      expect(info).toHaveBeenCalledWith('With: no values remaining to parse');
    });
  });
});
