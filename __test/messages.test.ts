import { describe, expect, test } from 'vitest';
import { QUERY_LABELS } from '#s/constants';
import { MESSAGES } from '#s/messages';

describe('MESSAGES catalog', () => {
  describe('lifecycle and argument checks', () => {
    test('noValues returns formatted message', () => {
      expect(MESSAGES.noValues(QUERY_LABELS.FLT)).toBe('Filter: no values given');
    });

    test('noValue returns formatted message', () => {
      expect(MESSAGES.noValue(QUERY_LABELS.LMT)).toBe('Limit: no value given');
    });

    test('noRemaining returns formatted message', () => {
      expect(MESSAGES.noRemaining(QUERY_LABELS.WTH)).toBe('With: no values remaining to parse');
    });

    test('notArray returns formatted message', () => {
      expect(MESSAGES.notArray(QUERY_LABELS.FLT, 'string')).toBe(
        'Filter: argument must be an array, got string instead',
      );
    });

    test('itemNotArray returns formatted message', () => {
      expect(MESSAGES.itemNotArray(QUERY_LABELS.OBY, 'number')).toBe(
        'OrderBySortBy: must have a type of array, got number instead',
      );
    });
  });

  describe('tuple and key checks', () => {
    test('itemNotKeyValue returns formatted message with index', () => {
      expect(MESSAGES.itemNotKeyValue(QUERY_LABELS.SRC, 3, 1)).toBe(
        'Search: must have a key-value array, but got length 3 at index 1 instead',
      );
    });

    test('invalidKey returns formatted message with index', () => {
      expect(MESSAGES.invalidKey(QUERY_LABELS.SCR, 'number', 2)).toBe(
        'SearchCriteria: must have keys as non-empty strings, got number at index 2 instead',
      );
    });
  });

  describe('value validations', () => {
    test('mustBeString returns formatted message', () => {
      expect(MESSAGES.mustBeString(QUERY_LABELS.INC, 'number')).toBe(
        'Include: value must be a string, got number instead',
      );
    });

    test('mustBePositiveInteger without zero', () => {
      expect(MESSAGES.mustBePositiveInteger(QUERY_LABELS.PAG, 'string')).toBe(
        'Page: must be a positive integer, got string instead',
      );
    });

    test('mustBePositiveInteger with zero allowed', () => {
      expect(MESSAGES.mustBePositiveInteger(QUERY_LABELS.LMT, 'string', true)).toBe(
        'Limit: must be a positive integer or zero, got string instead',
      );
    });

    test('mustBeEither returns formatted message', () => {
      expect(MESSAGES.mustBeEither(QUERY_LABELS.SJO, 'and', 'or', 'xor')).toBe(
        'SearchJoin: must be either "and" or "or", got "xor" instead',
      );
    });

    test('invalidSortBy returns formatted message with index', () => {
      expect(MESSAGES.invalidSortBy(QUERY_LABELS.OBY, 'invalid', 0)).toBe(
        'OrderBySortBy: must have a valid SORT_BY value, but got invalid at index 0 instead',
      );
    });
  });

  describe('ignoring formatters', () => {
    test('missingConditionArray', () => {
      expect(MESSAGES.missingConditionArray(QUERY_LABELS.SRC)).toBe(
        "Search: ignoring array value: missing condition, expected 'in' or 'between'",
      );
    });

    test('invalidConditionArray', () => {
      expect(MESSAGES.invalidConditionArray(QUERY_LABELS.SRC, 0)).toBe(
        "Search: ignoring array value: invalid condition, expected 'in' or 'between' at index 0",
      );
    });

    test('invalidBetweenSize', () => {
      expect(MESSAGES.invalidBetweenSize(QUERY_LABELS.SRC, 3, 1)).toBe(
        "Search: ignoring array value: expected 2 elements for 'between', got 3 at index 1 instead",
      );
    });

    test('invalidBaseValue', () => {
      expect(MESSAGES.invalidBaseValue(QUERY_LABELS.SRC, 'object')).toBe(
        'Search: ignoring value: expected BaseValue, got object instead',
      );
    });

    test('invalidCondition', () => {
      expect(MESSAGES.invalidCondition(QUERY_LABELS.SRC, 'custom')).toBe(
        'Search: ignoring value: invalid condition value, got custom',
      );
    });

    test('invalidValueAtIndex', () => {
      expect(MESSAGES.invalidValueAtIndex(QUERY_LABELS.SCR, 'object', 0)).toBe(
        'SearchCriteria: ignoring value: expected BaseValue, got object at index 0 instead',
      );
    });
  });
});
