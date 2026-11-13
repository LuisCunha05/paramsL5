import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { Include } from '#gen/include';

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
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

describe('Include class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format include relations correctly', () => {
        input = ['author', 'comments'];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['author', 'comments', 'author'];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('validations and edge cases', () => {
      test('should throw error if called with a non-array', () => {
        input = 'not an array';

        expect(() => Include.build(input, { logger: noOpLogger })).toThrow(
          ParamsL5ValidationError,
        );
        expect(() => Include.build(input, { logger: noOpLogger })).toThrow(
          'include: argument must be an array, got string instead',
        );
      });

      test('should return empty result if called with an empty array', () => {
        input = [];
        expected = { [QUERY_NAMES.INC]: undefined };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out non-string items', () => {
        input = ['author', 123, 'comments'];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['author', '', 'comments', '   '];
        expected = { [QUERY_NAMES.INC]: 'author,comments' };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return empty result if no values remain after filtering', () => {
        input = [123];
        expected = { [QUERY_NAMES.INC]: undefined };

        result = Include.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('include logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        expect(() => Include.build(input, { logger })).toThrow();

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: argument must be an array, got string instead',
        );
      });

      test('should log info if an item is not a string', () => {
        input = ['author', 123];

        Include.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        Include.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: no values given',
        );
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        Include.build(input, { logger });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'include: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'include: no values remaining to parse',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should format include relations correctly', () => {
        input = ['author', 'comments'];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return unique values if there are duplicates', () => {
        input = ['author', 'comments', 'author'];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('validations and edge cases', () => {
      test('should return failure result if called with a non-array', () => {
        input = 'not an array';

        result = Include.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.INC);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'include: argument must be an array, got string instead',
          );
        }
      });

      test('should return success result with undefined if called with an empty array', () => {
        input = [];
        expected = {
          data: { [QUERY_NAMES.INC]: undefined },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out non-string items', () => {
        input = ['author', 123, 'comments'];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter out empty strings', () => {
        input = ['author', '', 'comments', '   '];
        expected = {
          data: { [QUERY_NAMES.INC]: 'author,comments' },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should return success result with undefined if no values remain after filtering', () => {
        input = [123];
        expected = {
          data: { [QUERY_NAMES.INC]: undefined },
          success: true,
        };

        result = Include.safe(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('include logging', () => {
      test('should log error if argument is not an array', () => {
        input = 'not an array';

        Include.safe(input, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'include: argument must be an array, got string instead',
        );
      });

      test('should log info if an item is not a string', () => {
        input = ['author', 123];

        Include.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: value must be a string, got number instead',
        );
      });

      test('should log info with empty array', () => {
        input = [];

        Include.safe(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'include: no values given',
        );
      });

      test('should log info with no values remaining to parse', () => {
        input = [123];

        Include.safe(input, { logger });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'include: value must be a string, got number instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'include: no values remaining to parse',
        );
      });
    });
  });
});
