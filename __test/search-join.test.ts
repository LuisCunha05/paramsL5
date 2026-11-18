import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES, SEARCH_JOIN } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { SearchJoin } from '#gen/search-join';

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

describe('SearchJoin class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format both "and" and "or" searchJoin values', () => {
        expect(
          SearchJoin.build(SEARCH_JOIN.AND, { logger: noOpLogger }),
        ).toEqual({
          [QUERY_NAMES.SJO]: SEARCH_JOIN.AND,
        });
        expect(
          SearchJoin.build(SEARCH_JOIN.OR, { logger: noOpLogger }),
        ).toEqual({
          [QUERY_NAMES.SJO]: SEARCH_JOIN.OR,
        });
      });

      test('should format without options', () => {
        expect(SearchJoin.build(SEARCH_JOIN.OR)).toEqual({
          [QUERY_NAMES.SJO]: SEARCH_JOIN.OR,
        });
      });

      test('should return defaultSearchJoin when input is undefined or null', () => {
        expected = { [QUERY_NAMES.SJO]: SEARCH_JOIN.OR };

        expect(
          SearchJoin.build(undefined, {
            defaultSearchJoin: SEARCH_JOIN.OR,
            logger: noOpLogger,
          }),
        ).toEqual(expected);
        expect(
          SearchJoin.build(null, {
            defaultSearchJoin: SEARCH_JOIN.OR,
            logger: noOpLogger,
          }),
        ).toEqual(expected);
      });

      test('should prioritize input value over defaultSearchJoin', () => {
        expect(
          SearchJoin.build(SEARCH_JOIN.AND, {
            defaultSearchJoin: SEARCH_JOIN.OR,
            logger: noOpLogger,
          }),
        ).toEqual({ [QUERY_NAMES.SJO]: SEARCH_JOIN.AND });
      });
    });

    describe('validations and edge cases', () => {
      test('should return empty result when called with undefined, null, or no arguments', () => {
        expected = { [QUERY_NAMES.SJO]: undefined };

        expect(SearchJoin.build()).toEqual(expected);
        expect(SearchJoin.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(SearchJoin.build(null, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should throw ParamsL5ValidationError with field, value, and issues for invalid join string', () => {
        input = 'invalid';
        let caught: unknown;

        try {
          SearchJoin.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.SJO);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'SearchJoin: must be either "and" or "or", got "invalid" instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.SJO,
              message:
                'SearchJoin: must be either "and" or "or", got "invalid" instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'number', value: 123, type: 'number' },
        { label: 'empty string', value: '', type: 'string' },
        { label: 'whitespace string', value: '   ', type: 'string' },
        { label: 'object', value: {}, type: 'object' },
        { label: 'array', value: [], type: 'Array' },
        { label: 'boolean', value: true, type: 'boolean' },
      ])('should throw error when called with $label', ({ value, type }) => {
        expect(() =>
          SearchJoin.build(value as never, { logger: noOpLogger }),
        ).toThrow(`SearchJoin: value must be a string, got ${type} instead`);
      });

      test('should throw error when defaultSearchJoin is invalid and value is undefined', () => {
        expect(() =>
          SearchJoin.build(undefined, {
            defaultSearchJoin: 'xor' as never,
            logger: noOpLogger,
          }),
        ).toThrow(
          'SearchJoin: must be either "and" or "or", got "xor" instead',
        );
      });

      test('should fall back to valid defaultSearchJoin or undefined when strict is false', () => {
        expect(
          SearchJoin.build('xor' as never, {
            defaultSearchJoin: SEARCH_JOIN.OR,
            strict: false,
          }),
        ).toEqual({ [QUERY_NAMES.SJO]: SEARCH_JOIN.OR });

        expect(SearchJoin.build('xor' as never, { strict: false })).toEqual({
          [QUERY_NAMES.SJO]: undefined,
        });

        expect(
          SearchJoin.safe(123 as never, {
            defaultSearchJoin: 'bad' as never,
            strict: false,
          }),
        ).toEqual({
          data: { [QUERY_NAMES.SJO]: undefined },
          success: true,
        });
      });
    });

    describe('SearchJoin logging', () => {
      test('should not log anything for valid values', () => {
        SearchJoin.build(SEARCH_JOIN.AND, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        SearchJoin.build(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: no value given',
        );

        vi.clearAllMocks();

        SearchJoin.build(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: no value given',
        );
      });

      test('should log error when called with non-string', () => {
        expect(() => SearchJoin.build(123 as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: value must be a string, got number instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error when called with invalid join string', () => {
        expect(() => SearchJoin.build('invalid' as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: must be either "and" or "or", got "invalid" instead',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format both "and" and "or" searchJoin values', () => {
        expect(
          SearchJoin.safe(SEARCH_JOIN.AND, { logger: noOpLogger }),
        ).toEqual({
          data: { [QUERY_NAMES.SJO]: SEARCH_JOIN.AND },
          success: true,
        });
        expect(SearchJoin.safe(SEARCH_JOIN.OR)).toEqual({
          data: { [QUERY_NAMES.SJO]: SEARCH_JOIN.OR },
          success: true,
        });
      });

      test('should return defaultSearchJoin when input is undefined or null', () => {
        expected = {
          data: { [QUERY_NAMES.SJO]: SEARCH_JOIN.OR },
          success: true,
        };

        expect(
          SearchJoin.safe(undefined, {
            defaultSearchJoin: SEARCH_JOIN.OR,
            logger: noOpLogger,
          }),
        ).toEqual(expected);
        expect(
          SearchJoin.safe(null, {
            defaultSearchJoin: SEARCH_JOIN.OR,
            logger: noOpLogger,
          }),
        ).toEqual(expected);
      });
    });

    describe('validations and edge cases', () => {
      test('should return success result with undefined for undefined, null, or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.SJO]: undefined },
          success: true,
        };

        expect(SearchJoin.safe()).toEqual(expected);
        expect(SearchJoin.safe(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(SearchJoin.safe(null, { logger: noOpLogger })).toEqual(expected);
      });

      test('should return failure result for invalid join string', () => {
        input = 'invalid';

        result = SearchJoin.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.SJO);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'SearchJoin: must be either "and" or "or", got "invalid" instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.SJO,
              message:
                'SearchJoin: must be either "and" or "or", got "invalid" instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'number', value: 123, type: 'number' },
        { label: 'empty string', value: '', type: 'string' },
        { label: 'whitespace string', value: '   ', type: 'string' },
        { label: 'object', value: {}, type: 'object' },
        { label: 'array', value: [], type: 'Array' },
      ])(
        'should return failure result when called with $label',
        ({ value, type }) => {
          result = SearchJoin.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.SJO);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `SearchJoin: value must be a string, got ${type} instead`,
            );
          }
        },
      );
    });

    describe('SearchJoin logging', () => {
      test('should not log anything for valid values', () => {
        SearchJoin.safe(SEARCH_JOIN.OR, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        SearchJoin.safe(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: no value given',
        );

        vi.clearAllMocks();

        SearchJoin.safe(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: no value given',
        );
      });

      test('should log error when called with an invalid value', () => {
        SearchJoin.safe('invalid' as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'SearchJoin: must be either "and" or "or", got "invalid" instead',
        );
      });
    });
  });
});
