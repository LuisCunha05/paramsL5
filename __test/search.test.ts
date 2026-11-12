import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { CONDITIONS, QUERY_NAMES } from '#/constants';
import { logger as loggerFn } from '#/logger';
import { search } from '#gen/search';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any;

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const logger = { info, warn, error };
const noOpLogger = loggerFn();

beforeEach(() => {
  input = undefined;
  result = undefined;
  expected = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('search function', () => {
  describe('formatting', () => {
    test('should format a single search param without searchFields by default', () => {
      input = [['name', 'John']];
      expected = {
        [QUERY_NAMES.SRC]: 'name:John',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input);

      expect(result).toEqual(expected);
    });

    test('should include searchFields when includeSearchFields is true', () => {
      input = [['name', 'John', CONDITIONS.EQ]];
      expected = {
        [QUERY_NAMES.SRC]: 'name:John',
        [QUERY_NAMES.SFI]: 'name:=',
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should change default condition when options is provided with includeSearchFields', () => {
      input = [['name', 'John']];
      expected = {
        [QUERY_NAMES.SRC]: 'name:John',
        [QUERY_NAMES.SFI]: 'name:>',
      };

      result = search(input, {
        defaultCondition: CONDITIONS.GT,
        includeSearchFields: true,
      });

      expect(result).toEqual(expected);
    });

    test('should format a valid key-value pair with a specific condition when includeSearchFields is true', () => {
      input = [['age', 18, CONDITIONS.GTE]];
      expected = {
        [QUERY_NAMES.SRC]: 'age:18',
        [QUERY_NAMES.SFI]: 'age:>=',
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should handle "in" condition with array of values when includeSearchFields is true', () => {
      input = [['status', ['active', 'pending'], CONDITIONS.IN]];
      expected = {
        [QUERY_NAMES.SRC]: 'status:active,pending',
        [QUERY_NAMES.SFI]: 'status:in',
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should handle "in" condition with array of length 1 when includeSearchFields is true', () => {
      input = [['status', ['active'], CONDITIONS.IN]];
      expected = {
        [QUERY_NAMES.SRC]: 'status:active',
        [QUERY_NAMES.SFI]: 'status:in',
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should handle "between" condition with tuple of values when includeSearchFields is true', () => {
      input = [['date', ['2023-01-01', '2023-12-31'], CONDITIONS.BTW]];
      expected = {
        [QUERY_NAMES.SRC]: 'date:2023-01-01,2023-12-31',
        [QUERY_NAMES.SFI]: `date:${CONDITIONS.BTW}`,
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should update the value if the key already exists (deduplication) with includeSearchFields', () => {
      input = [
        ['name', 'John', CONDITIONS.LIKE],
        ['name', 'Doe', CONDITIONS.LIKE],
      ];
      expected = {
        [QUERY_NAMES.SRC]: 'name:Doe',
        [QUERY_NAMES.SFI]: 'name:like',
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should format multiple search params correctly when includeSearchFields is true', () => {
      input = [
        ['name', 'John', CONDITIONS.LIKE],
        ['email', 'gmail', CONDITIONS.ILIKE],
      ];
      expected = {
        [QUERY_NAMES.SRC]: 'name:John;email:gmail',
        [QUERY_NAMES.SFI]: 'name:like;email:ilike',
      };

      result = search(input, { includeSearchFields: true });

      expect(result).toEqual(expected);
    });

    test('should omit searchFields by default even when conditions are provided', () => {
      input = [
        ['name', 'John'],
        ['age', 18, CONDITIONS.GTE],
      ];
      expected = {
        [QUERY_NAMES.SRC]: 'name:John;age:18',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input);

      expect(result).toEqual(expected);
    });

    test('should omit searchFields when includeSearchFields option is false', () => {
      input = [['age', 18, CONDITIONS.GTE]];
      expected = {
        [QUERY_NAMES.SRC]: 'age:18',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input, { includeSearchFields: false });

      expect(result).toEqual(expected);
    });
  });

  describe('validations and edge cases', () => {
    test('should return empty result if called with no arguments', () => {
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(undefined, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if called with an empty array', () => {
      input = [];
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if argument is not an array', () => {
      input = 'invalid';
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should ignore item if it is not an array', () => {
      input = [['name', 'John'], 'invalid'];
      expected = {
        [QUERY_NAMES.SRC]: 'name:John',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should return empty result if key is not a non-empty string', () => {
      input = [['', 'value']];
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should ignore entries if value is null or undefined', () => {
      input = [
        ['status', 'active', CONDITIONS.EQ],
        ['ignored', null],
        ['alsoIgnored', undefined],
      ];
      expected = {
        [QUERY_NAMES.SRC]: 'status:active',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should ignore entries with invalid condition', () => {
      input = [
        ['name', 'John', 'INVALID_CONDITION'],
        ['status', 'active'],
      ];
      expected = {
        [QUERY_NAMES.SRC]: 'status:active',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test('should ignore array value if it is empty or has invalid items', () => {
      input = [
        ['status', 'active', CONDITIONS.EQ],
        ['emptyArray', [], CONDITIONS.IN],
        ['invalidArray', [{}], CONDITIONS.IN],
      ];
      expected = {
        [QUERY_NAMES.SRC]: 'status:active',
        [QUERY_NAMES.SFI]: undefined,
      };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test("shouldn't handle array value for non 'in' condition", () => {
      input = [['status', [1, 2, 3], CONDITIONS.DIFF]];
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test("shouldn't handle array value for non 'between' condition", () => {
      input = [['status', ['active', 'pending'], CONDITIONS.GT]];
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test("shouldn't handle array with length less than 2 for 'between' condition", () => {
      input = [['status', ['active'], CONDITIONS.BTW]];
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test("shouldn't handle array with length more than 2 for 'between' condition", () => {
      input = [['status', [1, 2, 3], CONDITIONS.BTW]];
      expected = { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined };

      result = search(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe('Search logging', () => {
    test('should log warn if key is not a non-empty string', () => {
      input = [['', 'value']];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'Search: must have keys as non-empty strings, but got string at index 0 instead',
      );
    });

    test('should log warn if item is not an array', () => {
      input = [['name', 'John'], 'invalid'];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'Search: must have a type of array, got string instead',
      );
    });

    test('should log error if argument is not an array', () => {
      input = 'invalid';

      search(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'Search: argument must be an array, got string instead',
      );
    });

    test('should log warn if item length is less than 2', () => {
      input = [['name']];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'Search: must have a key-value array, but got length 1 at index 0 instead',
      );
    });

    test('should log warn if array value is missing condition', () => {
      input = [['status', ['active', 'pending']]];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        "Search: ignoring array value: missing condition, expected 'in' or 'between'",
      );
    });

    test('should log warn if array value has invalid condition', () => {
      input = [['status', ['active', 'pending'], CONDITIONS.EQ]];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        "Search: ignoring array value: invalid condition, expected 'in' or 'between' at index 0",
      );
    });

    test('should log warn if array value for between condition does not have size 2', () => {
      input = [['date', ['2023-01-01'], CONDITIONS.BTW]];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        "Search: ignoring array value: expected 2 elements for 'between', got 1 at index 0 instead",
      );
    });

    test('should log info if value is not a BaseValue', () => {
      input = [['name', { obj: true }]];

      search(input, { logger });

      expect(info).toHaveBeenCalledTimes(2);
      expect(info).toHaveBeenNthCalledWith(
        1,
        'Search: ignoring value: expected BaseValue, got object instead',
      );
      expect(info).toHaveBeenNthCalledWith(
        2,
        'Search: no values remaining to parse',
      );
    });

    test('should log warn if condition is invalid', () => {
      input = [['name', 'John', 'INVALID_CONDITION']];

      search(input, { logger });

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'Search: ignoring value: invalid condition value, got John',
      );
    });

    test('should log info if arg is empty array', () => {
      input = [];

      search(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith('Search: no values given');
    });

    test('should log info if no values remain after filtering', () => {
      input = [['name', { obj: true }]];

      search(input, { logger });

      expect(info).toHaveBeenCalledTimes(2);
      expect(info).toHaveBeenNthCalledWith(
        1,
        'Search: ignoring value: expected BaseValue, got object instead',
      );
      expect(info).toHaveBeenNthCalledWith(
        2,
        'Search: no values remaining to parse',
      );
    });
  });
});
