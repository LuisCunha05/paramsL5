import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { Limit } from '#gen/limit';

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
const noOpLogger = loggerFn();

afterEach(() => {
  vi.clearAllMocks();
});

describe('Limit class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format a positive integer limit', () => {
        input = 7;
        expected = { [QUERY_NAMES.LMT]: '7' };

        result = Limit.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format without options', () => {
        expect(Limit.build(15)).toEqual({ [QUERY_NAMES.LMT]: '15' });
      });

      test('should allow 0 as a valid limit', () => {
        expect(Limit.build(0, { logger: noOpLogger })).toEqual({
          [QUERY_NAMES.LMT]: '0',
        });
      });

      test('should return defaultValue when input is undefined or null', () => {
        expected = { [QUERY_NAMES.LMT]: '6' };

        expect(
          Limit.build(undefined, { defaultValue: 6, logger: noOpLogger }),
        ).toEqual(expected);
        expect(
          Limit.build(null, { defaultValue: 6, logger: noOpLogger }),
        ).toEqual(expected);
      });

      test('should prioritize input value including 0 over defaultValue', () => {
        expect(
          Limit.build(10, { defaultValue: 6, logger: noOpLogger }),
        ).toEqual({
          [QUERY_NAMES.LMT]: '10',
        });
        expect(Limit.build(0, { defaultValue: 6, logger: noOpLogger })).toEqual(
          {
            [QUERY_NAMES.LMT]: '0',
          },
        );
      });
    });

    describe('validations and edge cases', () => {
      test('should return default limit "1" when called with undefined, null, or no arguments', () => {
        expected = { [QUERY_NAMES.LMT]: '1' };

        expect(Limit.build()).toEqual(expected);
        expect(Limit.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(Limit.build(null, { logger: noOpLogger })).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with field, value, and issues for negative numbers', () => {
        input = -10;
        let caught: unknown;

        try {
          Limit.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.LMT);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'Limit: must be a positive integer or zero, got number instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.LMT,
              message:
                'Limit: must be a positive integer or zero, got number instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'decimal', value: 1.5, type: 'number' },
        { label: 'NaN', value: Number.NaN, type: 'NaN' },
        { label: 'Infinity', value: Number.POSITIVE_INFINITY, type: 'number' },
        { label: 'string', value: '10', type: 'string' },
        { label: 'object', value: {}, type: 'object' },
        { label: 'array', value: [], type: 'Array' },
        { label: 'boolean', value: true, type: 'boolean' },
      ])('should throw error when called with $label', ({ value, type }) => {
        expect(() =>
          Limit.build(value as never, { logger: noOpLogger }),
        ).toThrow(
          `Limit: must be a positive integer or zero, got ${type} instead`,
        );
      });

      test('should throw error when defaultValue is invalid and value is undefined', () => {
        expect(() =>
          Limit.build(undefined, { defaultValue: -1, logger: noOpLogger }),
        ).toThrow(
          'Limit: must be a positive integer or zero, got number instead',
        );
      });
    });

    describe('Limit logging', () => {
      test('should not log anything for valid values', () => {
        Limit.build(10, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined, null, or no arguments', () => {
        Limit.build(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Limit: no value given');

        vi.clearAllMocks();

        Limit.build(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Limit: no value given');
      });

      test('should log error when called with an invalid number', () => {
        expect(() => Limit.build(-10, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Limit: must be a positive integer or zero, got number instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error when called with NaN', () => {
        expect(() => Limit.build(Number.NaN, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Limit: must be a positive integer or zero, got NaN instead',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format a positive integer limit', () => {
        expect(Limit.safe(7, { logger: noOpLogger })).toEqual({
          data: { [QUERY_NAMES.LMT]: '7' },
          success: true,
        });
      });

      test('should format without options and allow 0', () => {
        expect(Limit.safe(0)).toEqual({
          data: { [QUERY_NAMES.LMT]: '0' },
          success: true,
        });
      });

      test('should return defaultValue when input is undefined or null', () => {
        expected = {
          data: { [QUERY_NAMES.LMT]: '6' },
          success: true,
        };

        expect(
          Limit.safe(undefined, { defaultValue: 6, logger: noOpLogger }),
        ).toEqual(expected);
        expect(
          Limit.safe(null, { defaultValue: 6, logger: noOpLogger }),
        ).toEqual(expected);
      });
    });

    describe('validations and edge cases', () => {
      test('should return success result with default limit "1" for undefined, null, or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.LMT]: '1' },
          success: true,
        };

        expect(Limit.safe()).toEqual(expected);
        expect(Limit.safe(undefined, { logger: noOpLogger })).toEqual(expected);
        expect(Limit.safe(null, { logger: noOpLogger })).toEqual(expected);
      });

      test('should return failure result for negative numbers', () => {
        input = -10;

        result = Limit.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.LMT);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'Limit: must be a positive integer or zero, got number instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.LMT,
              message:
                'Limit: must be a positive integer or zero, got number instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'decimal', value: 1.5, type: 'number' },
        { label: 'NaN', value: Number.NaN, type: 'NaN' },
        { label: 'string', value: '10', type: 'string' },
        { label: 'object', value: {}, type: 'object' },
        { label: 'array', value: [], type: 'Array' },
      ])(
        'should return failure result when called with $label',
        ({ value, type }) => {
          result = Limit.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.LMT);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `Limit: must be a positive integer or zero, got ${type} instead`,
            );
          }
        },
      );
    });

    describe('Limit logging', () => {
      test('should not log anything for valid values', () => {
        Limit.safe(10, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        Limit.safe(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Limit: no value given');

        vi.clearAllMocks();

        Limit.safe(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Limit: no value given');
      });

      test('should log error when called with an invalid value', () => {
        Limit.safe(-10, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Limit: must be a positive integer or zero, got number instead',
        );
      });
    });
  });
});
