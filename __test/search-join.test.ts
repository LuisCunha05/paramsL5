import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES, SEARCH_JOIN } from '#/constants';
import { logger as loggerFn } from '#/logger';
import { searchJoin } from '#gen/search-join';

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

describe('searchJoin function', () => {
  describe('formatting', () => {
    test('should format searchJoin correctly', () => {
      input = SEARCH_JOIN.AND;
      expected = { [QUERY_NAMES.SJO]: SEARCH_JOIN.AND };

      result = searchJoin(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return empty result if called with a non-string', () => {
      input = 123;
      expected = { [QUERY_NAMES.SJO]: undefined };

      result = searchJoin(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if called with an invalid join string', () => {
      input = 'invalid';
      expected = { [QUERY_NAMES.SJO]: undefined };

      result = searchJoin(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if argument is undefined', () => {
      expected = { [QUERY_NAMES.SJO]: undefined };
      result = searchJoin(undefined, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('searchJoin logging', () => {
    test('should log error if argument is not a string', () => {
      input = 123;

      searchJoin(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'SearchJoin: value must be a string, got number instead',
      );
    });

    test('should log error if argument is invalid search join', () => {
      input = 'invalid';

      searchJoin(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        `SearchJoin: must be either "${SEARCH_JOIN.AND}" or "${SEARCH_JOIN.OR}", got "invalid" instead`,
      );
    });

    test('should log info if argument is undefined', () => {
      searchJoin(undefined, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith(
        'SearchJoin: no value given',
      );
    });
  });
});
