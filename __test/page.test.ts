import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { Page } from '#gen/page';

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

describe('Page class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format page correctly', () => {
        input = 3;
        expected = { [QUERY_NAMES.PAG]: '3' };

        result = Page.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should format page without options and allow 1', () => {
        expect(Page.build(1)).toEqual({ [QUERY_NAMES.PAG]: '1' });
      });
    });

    describe('validations and edge cases', () => {
      test('should return default page "1" when called with undefined, null, or no arguments', () => {
        expected = { [QUERY_NAMES.PAG]: '1' };

        expect(Page.build()).toEqual(expected);
        expect(Page.build(undefined, { logger: noOpLogger })).toEqual(expected);
        expect(Page.build(null, { logger: noOpLogger })).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with field, value, and issues for 0', () => {
        input = 0;
        let caught: unknown;

        try {
          Page.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.PAG);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'Page: must be a positive integer, got number instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.PAG,
              message: 'Page: must be a positive integer, got number instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'negative number', value: -5, type: 'number' },
        { label: 'decimal', value: 1.5, type: 'number' },
        { label: 'NaN', value: Number.NaN, type: 'NaN' },
        {
          label: 'Infinity',
          value: Number.POSITIVE_INFINITY,
          type: 'Infinity',
        },
        { label: 'string', value: 'invalid', type: 'string' },
        { label: 'object', value: {}, type: 'object' },
        { label: 'array', value: [], type: 'Array' },
        { label: 'boolean', value: true, type: 'boolean' },
      ])('should throw error when called with $label', ({ value, type }) => {
        expect(() =>
          Page.build(value as never, { logger: noOpLogger }),
        ).toThrow(`Page: must be a positive integer, got ${type} instead`);
      });

      test('should fall back to defaultValue or "1" when strict is false and input is invalid', () => {
        expect(Page.build(0, { defaultValue: 3, strict: false })).toEqual({
          [QUERY_NAMES.PAG]: '3',
        });
        expect(Page.build(0, { strict: false })).toEqual({
          [QUERY_NAMES.PAG]: '1',
        });
        expect(Page.build(-3, { strict: false })).toEqual({
          [QUERY_NAMES.PAG]: '1',
        });
        expect(
          Page.safe('invalid' as never, { defaultValue: -2, strict: false }),
        ).toEqual({
          data: { [QUERY_NAMES.PAG]: '1' },
          success: true,
        });
      });
    });

    describe('Page logging', () => {
      test('should not log anything for valid values', () => {
        Page.build(2, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        Page.build(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Page: no value given');

        vi.clearAllMocks();

        Page.build(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Page: no value given');
      });

      test('should log error when called with 0 or negative number', () => {
        expect(() => Page.build(0, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Page: must be a positive integer, got number instead',
        );
        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      });

      test('should log error when called with non-number', () => {
        expect(() => Page.build('invalid' as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Page: must be a positive integer, got string instead',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format page correctly', () => {
        expect(Page.safe(3, { logger: noOpLogger })).toEqual({
          data: { [QUERY_NAMES.PAG]: '3' },
          success: true,
        });
      });

      test('should format page without options', () => {
        expect(Page.safe(1)).toEqual({
          data: { [QUERY_NAMES.PAG]: '1' },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return success result with default page "1" for undefined, null, or no arguments', () => {
        expected = {
          data: { [QUERY_NAMES.PAG]: '1' },
          success: true,
        };

        expect(Page.safe()).toEqual(expected);
        expect(Page.safe(undefined, { logger: noOpLogger })).toEqual(expected);
        expect(Page.safe(null, { logger: noOpLogger })).toEqual(expected);
      });

      test('should return failure result for 0', () => {
        input = 0;

        result = Page.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.PAG);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'Page: must be a positive integer, got number instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.PAG,
              message: 'Page: must be a positive integer, got number instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'negative number', value: -5, type: 'number' },
        { label: 'decimal', value: 1.5, type: 'number' },
        { label: 'NaN', value: Number.NaN, type: 'NaN' },
        { label: 'string', value: 'invalid', type: 'string' },
        { label: 'object', value: {}, type: 'object' },
        { label: 'array', value: [], type: 'Array' },
      ])(
        'should return failure result when called with $label',
        ({ value, type }) => {
          result = Page.safe(value as never, { logger: noOpLogger });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
            expect(result.error.field).toBe(QUERY_NAMES.PAG);
            expect(result.error.value).toBe(value);
            expect(result.error.message).toBe(
              `Page: must be a positive integer, got ${type} instead`,
            );
          }
        },
      );
    });

    describe('Page logging', () => {
      test('should not log anything for valid values', () => {
        Page.safe(2, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        Page.safe(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Page: no value given');

        vi.clearAllMocks();

        Page.safe(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Page: no value given');
      });

      test('should log error when called with an invalid value', () => {
        Page.safe(-5, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Page: must be a positive integer, got number instead',
        );
      });
    });
  });
});
