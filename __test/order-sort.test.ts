import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES, SORT_BY } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn } from '#/logger';
import { OrderBySortBy } from '#gen/order-sort';

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

describe('OrderBySortBy class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should generate correct URL params for a single order/sort pair', () => {
        input = { name: SORT_BY.ASC };
        expected = {
          [QUERY_NAMES.OBY]: 'name',
          [QUERY_NAMES.SBY]: 'asc',
        };

        result = OrderBySortBy.build(input);

        expect(result).toEqual(expected);
      });

      test('should generate correct string params with multiple order/sort pairs', () => {
        input = {
          name: SORT_BY.ASC,
          age: SORT_BY.DESC,
          created_at: SORT_BY.ASC,
        };
        expected = {
          [QUERY_NAMES.OBY]: 'name;age;created_at',
          [QUERY_NAMES.SBY]: 'asc;desc;asc',
        };

        result = OrderBySortBy.build(input);

        expect(result).toEqual(expected);
      });

      test('should deduplicate keys after trimming and capture the last value', () => {
        input = {
          name: SORT_BY.ASC,
          '  name  ': SORT_BY.DESC,
        };
        expected = {
          [QUERY_NAMES.OBY]: 'name',
          [QUERY_NAMES.SBY]: 'desc',
        };

        result = OrderBySortBy.build(input);

        expect(result).toEqual(expected);
      });

      test('should trim key strings', () => {
        input = { '  name  ': SORT_BY.ASC };
        expected = {
          [QUERY_NAMES.OBY]: 'name',
          [QUERY_NAMES.SBY]: 'asc',
        };

        result = OrderBySortBy.build(input);

        expect(result).toEqual(expected);
      });

      test('should support typed generic shapes with Date fields and TPathPipe relations', () => {
        interface Post {
          title: string;
        }
        interface User {
          name: string;
          created_at: Date;
          posts: Post[];
          profile: { city: string };
        }

        result = OrderBySortBy.build<User>({
          name: SORT_BY.ASC,
          created_at: SORT_BY.DESC,
          'posts|title': SORT_BY.DESC,
          'posts:user_id|title': SORT_BY.ASC,
          'profile|city': true,
        });

        expect(result).toEqual({
          [QUERY_NAMES.OBY]:
            'name;created_at;posts|title;posts:user_id|title;profile|city',
          [QUERY_NAMES.SBY]: 'asc;desc;desc;asc;asc',
        });

        // @ts-expect-error Invalid path 'unknown_field' for User
        OrderBySortBy.build<User>({ unknown_field: SORT_BY.ASC });
      });
    });

    describe('default options', () => {
      test('should allow true value with default ASC sortBy', () => {
        input = { key: true };
        expected = {
          [QUERY_NAMES.OBY]: 'key',
          [QUERY_NAMES.SBY]: 'asc',
        };

        result = OrderBySortBy.build(input);

        expect(result).toEqual(expected);
      });

      test('should change the default sortBy when value is true', () => {
        input = { key: true };
        expected = {
          [QUERY_NAMES.OBY]: 'key',
          [QUERY_NAMES.SBY]: 'desc',
        };

        result = OrderBySortBy.build(input, { defaultSortBy: SORT_BY.DESC });

        expect(result).toEqual(expected);
      });

      test('should allow multiple true values with the default sortBy', () => {
        input = { key1: true, key2: true };
        expected = {
          [QUERY_NAMES.OBY]: 'key1;key2',
          [QUERY_NAMES.SBY]: 'desc;desc',
        };

        result = OrderBySortBy.build(input, { defaultSortBy: SORT_BY.DESC });

        expect(result).toEqual(expected);
      });

      test('should fall back to "asc" when defaultSortBy is invalid', () => {
        result = OrderBySortBy.build(
          { name: true },
          {
            defaultSortBy: 'invalid' as never,
            logger: noOpLogger,
          },
        );

        expect(result).toEqual({
          [QUERY_NAMES.OBY]: 'name',
          [QUERY_NAMES.SBY]: 'asc',
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return empty result when called with undefined, null, no arguments, or empty object', () => {
        expected = {
          [QUERY_NAMES.OBY]: undefined,
          [QUERY_NAMES.SBY]: undefined,
        };

        expect(OrderBySortBy.build()).toEqual(expected);
        expect(OrderBySortBy.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(OrderBySortBy.build(null, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(OrderBySortBy.build({}, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should throw ParamsL5ValidationError with field, value, and issues for non-object input', () => {
        input = 'invalid';
        let caught: unknown;

        try {
          OrderBySortBy.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.OBY);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'OrderBySortBy: value must be a object, got string instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.OBY,
              message:
                'OrderBySortBy: value must be a object, got string instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'string', value: 'invalid', type: 'string' },
        { label: 'number', value: 123, type: 'number' },
        { label: 'boolean', value: true, type: 'boolean' },
        { label: 'array', value: [['name', 'asc']], type: 'Array' },
        { label: 'Date', value: new Date(), type: 'object' },
        { label: 'NaN', value: Number.NaN, type: 'NaN' },
      ])('should throw error when called with $label', ({ value, type }) => {
        expect(() =>
          OrderBySortBy.build(value as never, { logger: noOpLogger }),
        ).toThrow(`OrderBySortBy: value must be a object, got ${type} instead`);
      });

      test('should return empty result if all entries are invalid, null, or undefined', () => {
        input = {
          '': SORT_BY.ASC,
          badSort: 'invalid_sort',
          falsy: false,
          ignored: null,
          missing: undefined,
        };
        expected = {
          [QUERY_NAMES.OBY]: undefined,
          [QUERY_NAMES.SBY]: undefined,
        };

        result = OrderBySortBy.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should filter invalid, null, and undefined entries and keep valid entries', () => {
        input = {
          '': SORT_BY.ASC,
          '   ': SORT_BY.DESC,
          ignored: null,
          missing: undefined,
          falsy: false,
          badSort: 'invalid_sort',
          numSort: 123,
          name: SORT_BY.DESC,
        };
        expected = {
          [QUERY_NAMES.OBY]: 'name',
          [QUERY_NAMES.SBY]: 'desc',
        };

        result = OrderBySortBy.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });
    });

    describe('OrderBySortBy logging', () => {
      test('should not log anything for valid values', () => {
        OrderBySortBy.build({ name: SORT_BY.ASC }, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        OrderBySortBy.build(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no value given',
        );

        vi.clearAllMocks();

        OrderBySortBy.build(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no value given',
        );
      });

      test('should log error if arg is not an object', () => {
        input = [['name', 'asc']];

        expect(() => OrderBySortBy.build(input, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: value must be a object, got Array instead',
        );
      });

      test('should log warn if key is empty or whitespace-only', () => {
        input = { '   ': SORT_BY.ASC };

        OrderBySortBy.build(input, { logger });

        expect(warn).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: must have keys as non-empty strings, but got string at index 0 instead',
        );
      });

      test('should log warn if sort value is not a valid SORT_BY value or true', () => {
        input = { name: 'invalid_sort' };

        OrderBySortBy.build(input, { logger });

        expect(warn).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: must have a valid SORT_BY value, but got invalid_sort at index 0 instead',
        );
      });

      test('should log warn if sort value is false', () => {
        input = { name: false };

        OrderBySortBy.build(input, { logger });

        expect(warn).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: must have a valid SORT_BY value, but got false at index 0 instead',
        );
      });

      test('should log warn if defaultSortBy is invalid', () => {
        OrderBySortBy.build(
          { name: true },
          {
            defaultSortBy: 'invalid' as never,
            logger,
          },
        );

        expect(warn).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: must be either "asc" or "desc", got "invalid" instead',
        );
      });

      test('should log info if arg is empty object', () => {
        input = {};

        OrderBySortBy.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no values given',
        );
      });

      test('should log info if no values remain after filtering', () => {
        input = { name: 'invalid_sort' };

        OrderBySortBy.build(input, { logger });

        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no values remaining to parse',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should return success result for valid object input', () => {
        result = OrderBySortBy.safe(
          { name: SORT_BY.ASC, created_at: true },
          {
            defaultSortBy: SORT_BY.DESC,
          },
        );

        expect(result).toEqual({
          data: {
            [QUERY_NAMES.OBY]: 'name;created_at',
            [QUERY_NAMES.SBY]: 'asc;desc',
          },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return success result with undefined fields for undefined, null, no args, or {}', () => {
        expected = {
          data: { [QUERY_NAMES.OBY]: undefined, [QUERY_NAMES.SBY]: undefined },
          success: true,
        };

        expect(OrderBySortBy.safe()).toEqual(expected);
        expect(OrderBySortBy.safe(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(OrderBySortBy.safe(null, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(OrderBySortBy.safe({}, { logger: noOpLogger })).toEqual(
          expected,
        );
      });

      test('should return failure result for non-object input', () => {
        input = [['name', 'asc']];

        result = OrderBySortBy.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.OBY);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'OrderBySortBy: value must be a object, got Array instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.OBY,
              message:
                'OrderBySortBy: value must be a object, got Array instead',
              value: input,
            },
          ]);
        }
      });

      test('should filter invalid entries and return success result', () => {
        result = OrderBySortBy.safe(
          {
            bad: 'invalid' as never,
            ignored: null,
            name: SORT_BY.DESC,
          },
          { logger: noOpLogger },
        );

        expect(result).toEqual({
          data: {
            [QUERY_NAMES.OBY]: 'name',
            [QUERY_NAMES.SBY]: 'desc',
          },
          success: true,
        });
      });
    });

    describe('OrderBySortBy logging', () => {
      test('should not log anything for valid values', () => {
        OrderBySortBy.safe({ name: SORT_BY.ASC }, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined, null, or empty object', () => {
        OrderBySortBy.safe(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no value given',
        );

        vi.clearAllMocks();

        OrderBySortBy.safe(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no value given',
        );

        vi.clearAllMocks();

        OrderBySortBy.safe({}, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: no values given',
        );
      });

      test('should log error when called with non-object', () => {
        OrderBySortBy.safe('invalid' as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'OrderBySortBy: value must be a object, got string instead',
        );
      });
    });
  });
});
