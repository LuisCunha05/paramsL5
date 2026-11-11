import { describe, expect, test } from 'vitest';

import { QUERY_LABELS } from '#/constants';
import {
  msgInvalidBaseValue,
  msgInvalidBetweenSize,
  msgInvalidCondition,
  msgInvalidConditionArray,
  msgInvalidKey,
  msgInvalidSortBy,
  msgInvalidValueAtIndex,
  msgItemNotArray,
  msgItemNotKeyValue,
  msgMissingConditionArray,
  msgMustBeEither,
  msgMustBePositiveInteger,
  msgMustBeString,
  msgNoRemaining,
  msgNotArray,
  msgNoValue,
  msgNoValues,
} from '#/messages';

describe('Message functions', () => {
  describe('lifecycle and argument checks', () => {
    test('msgNoValues returns formatted message', () => {
      expect(msgNoValues(QUERY_LABELS.FLT)).toBe('Filter: no values given');
    });

    test('msgNoValue returns formatted message', () => {
      expect(msgNoValue(QUERY_LABELS.LMT)).toBe('Limit: no value given');
    });

    test('msgNoRemaining returns formatted message', () => {
      expect(msgNoRemaining(QUERY_LABELS.WTH)).toBe(
        'With: no values remaining to parse',
      );
      expect(msgNoRemaining(QUERY_LABELS.WTC)).toBe(
        'WithCount: no values remaining to parse',
      );
    });

    test('msgNotArray returns formatted message', () => {
      expect(msgNotArray(QUERY_LABELS.FLT, 'string')).toBe(
        'Filter: argument must be an array, got string instead',
      );
    });

    test('msgItemNotArray returns formatted message', () => {
      expect(msgItemNotArray(QUERY_LABELS.OBY, 'number')).toBe(
        'OrderBySortBy: must have a type of array, got number instead',
      );
    });
  });

  describe('tuple and key checks', () => {
    test('msgItemNotKeyValue returns formatted message with index', () => {
      expect(msgItemNotKeyValue(QUERY_LABELS.SRC, 3, 1)).toBe(
        'Search: must have a key-value array, but got length 3 at index 1 instead',
      );
    });

    test('msgInvalidKey returns formatted message with index', () => {
      expect(msgInvalidKey(QUERY_LABELS.OBY, 'number', 2)).toBe(
        'OrderBySortBy: must have keys as non-empty strings, but got number at index 2 instead',
      );
    });
  });

  describe('value validations', () => {
    test('msgMustBeString returns formatted message', () => {
      expect(msgMustBeString(QUERY_LABELS.INC, 'number')).toBe(
        'Include: value must be a string, got number instead',
      );
    });

    test('msgMustBePositiveInteger without zero', () => {
      expect(msgMustBePositiveInteger(QUERY_LABELS.PAG, 'string')).toBe(
        'Page: must be a positive integer, got string instead',
      );
    });

    test('msgMustBePositiveInteger with zero allowed', () => {
      expect(msgMustBePositiveInteger(QUERY_LABELS.LMT, 'string', true)).toBe(
        'Limit: must be a positive integer or zero, got string instead',
      );
    });

    test('msgMustBeEither returns formatted message', () => {
      expect(msgMustBeEither(QUERY_LABELS.SJO, 'and', 'or', 'xor')).toBe(
        'SearchJoin: must be either "and" or "or", got "xor" instead',
      );
    });

    test('msgInvalidSortBy returns formatted message with index', () => {
      expect(msgInvalidSortBy(QUERY_LABELS.OBY, 'invalid', 0)).toBe(
        'OrderBySortBy: must have a valid SORT_BY value, but got invalid at index 0 instead',
      );
    });
  });

  describe('ignoring formatters', () => {
    test('msgMissingConditionArray', () => {
      expect(msgMissingConditionArray(QUERY_LABELS.SRC)).toBe(
        "Search: ignoring array value: missing condition, expected 'in' or 'between'",
      );
    });

    test('msgInvalidConditionArray', () => {
      expect(msgInvalidConditionArray(QUERY_LABELS.SRC, 0)).toBe(
        "Search: ignoring array value: invalid condition, expected 'in' or 'between' at index 0",
      );
    });

    test('msgInvalidBetweenSize', () => {
      expect(msgInvalidBetweenSize(QUERY_LABELS.SRC, 3, 1)).toBe(
        "Search: ignoring array value: expected 2 elements for 'between', got 3 at index 1 instead",
      );
    });

    test('msgInvalidBaseValue', () => {
      expect(msgInvalidBaseValue(QUERY_LABELS.SRC, 'object')).toBe(
        'Search: ignoring value: expected BaseValue, got object instead',
      );
    });

    test('msgInvalidCondition', () => {
      expect(msgInvalidCondition(QUERY_LABELS.SRC, 'custom')).toBe(
        'Search: ignoring value: invalid condition value, got custom',
      );
    });

    test('msgInvalidValueAtIndex', () => {
      expect(msgInvalidValueAtIndex(QUERY_LABELS.SRC, 'object', 0)).toBe(
        'Search: ignoring value: expected BaseValue, got object at index 0 instead',
      );
    });
  });
});
