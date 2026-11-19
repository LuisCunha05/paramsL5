import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { CONDITIONS, QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/params-l5-validation-error';
import { logger as loggerFn } from '#/logger';
import { Search } from '#gen/search';

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

describe('Search class', () => {
  describe('build', () => {
    describe('formatting', () => {
      test('should format a single search param without searchFields by default', () => {
        input = { name: 'John' };
        expected = {
          [QUERY_NAMES.SRC]: 'name:John',
          [QUERY_NAMES.SFI]: undefined,
        };

        result = Search.build(input);

        expect(result).toEqual(expected);
      });

      test('should trim string values and support falsy base values (0, false)', () => {
        input = { active: false, count: 0, name: '  John  ' };
        expected = {
          [QUERY_NAMES.SRC]: 'active:false;count:0;name:John',
          [QUERY_NAMES.SFI]: 'active:=;count:=;name:=',
        };

        result = Search.build(input, { includeSearchFields: true });

        expect(result).toEqual(expected);
      });

      test('should include searchFields when includeSearchFields is true', () => {
        input = { age: { gte: 18 }, name: { like: 'John' } };
        expected = {
          [QUERY_NAMES.SRC]: 'age:18;name:John',
          [QUERY_NAMES.SFI]: 'age:>=;name:like',
        };

        result = Search.build(input, { includeSearchFields: true });

        expect(result).toEqual(expected);
      });

      test('should omit searchFields when includeSearchFields is false even with explicit conditions', () => {
        input = { age: { gte: 18 }, name: { like: 'John' } };
        expected = {
          [QUERY_NAMES.SRC]: 'age:18;name:John',
          [QUERY_NAMES.SFI]: undefined,
        };

        result = Search.build(input, { includeSearchFields: false });

        expect(result).toEqual(expected);
      });

      test('should apply defaultCondition to shorthand values and preserve explicit conditions', () => {
        input = { age: { gte: 18 }, name: 'John' };
        expected = {
          [QUERY_NAMES.SRC]: 'age:18;name:John',
          [QUERY_NAMES.SFI]: 'age:>=;name:like',
        };

        result = Search.build(input, {
          defaultCondition: CONDITIONS.LIKE,
          includeSearchFields: true,
        });

        expect(result).toEqual(expected);
      });

      test.each([
        { condKey: 'eq', condVal: CONDITIONS.EQ, val: 'John' },
        { condKey: 'neq', condVal: CONDITIONS.NEQ, val: 'inactive' },
        { condKey: 'gt', condVal: CONDITIONS.GT, val: 10 },
        { condKey: 'gte', condVal: CONDITIONS.GTE, val: 18 },
        { condKey: 'lt', condVal: CONDITIONS.LT, val: 50 },
        { condKey: 'lte', condVal: CONDITIONS.LTE, val: 65 },
        { condKey: 'like', condVal: CONDITIONS.LIKE, val: 'Jo' },
        { condKey: 'ilike', condVal: CONDITIONS.ILIKE, val: 'jo' },
      ])(
        'should format "$condKey" condition properly',
        ({ condKey, condVal, val }) => {
          result = Search.build({ field: { [condKey]: val } } as never, {
            includeSearchFields: true,
          });

          expect(result).toEqual({
            [QUERY_NAMES.SRC]: `field:${val}`,
            [QUERY_NAMES.SFI]: `field:${condVal}`,
          });
        },
      );

      test('should handle "in" condition and skip null/undefined elements', () => {
        input = { status: { in: ['active', null, 'pending', undefined] } };
        expected = {
          [QUERY_NAMES.SRC]: 'status:active,pending',
          [QUERY_NAMES.SFI]: 'status:in',
        };

        result = Search.build(input, { includeSearchFields: true });

        expect(result).toEqual(expected);
      });

      test('should handle "in" condition with array of length 1 when includeSearchFields is true', () => {
        input = { status: { in: ['active'] } };
        expected = {
          [QUERY_NAMES.SRC]: 'status:active',
          [QUERY_NAMES.SFI]: 'status:in',
        };

        result = Search.build(input, { includeSearchFields: true });

        expect(result).toEqual(expected);
      });

      test('should handle "btw" condition with string and number tuples', () => {
        input = {
          age: { btw: [18, 30] },
          date: { btw: ['2023-01-01', '2023-12-31'] },
        };
        expected = {
          [QUERY_NAMES.SRC]: 'age:18,30;date:2023-01-01,2023-12-31',
          [QUERY_NAMES.SFI]: `age:${CONDITIONS.BTW};date:${CONDITIONS.BTW}`,
        };

        result = Search.build(input, { includeSearchFields: true });

        expect(result).toEqual(expected);
      });

      test('should support typed generic shapes with nested and array relations', () => {
        interface Post {
          title: string;
        }
        interface User {
          name: string;
          posts: Post[];
          profile: { city: string };
        }

        result = Search.build<User>(
          {
            name: { like: 'Alice' },
            'posts.title': 'vitest',
            'profile.city': { eq: 'NYC' },
          },
          { includeSearchFields: true },
        );

        expect(result).toEqual({
          [QUERY_NAMES.SRC]: 'name:Alice;posts.title:vitest;profile.city:NYC',
          [QUERY_NAMES.SFI]: 'name:like;posts.title:=;profile.city:=',
        });
      });

      test('should correlate search field values and operators with schema types', () => {
        interface Post {
          likes: number;
          title: string;
        }
        interface User {
          active: boolean;
          age: number;
          createdAt: Date;
          name: string;
          posts: Post[];
          profile?: { city: string } | null;
          role: 'admin' | 'user';
        }

        const valid = Search.build<User>(
          {
            active: true,
            age: { btw: [18, 65] },
            createdAt: { gte: '2026-01-01' },
            name: { like: 'Alice' },
            'posts.likes': { gt: 10 },
            'posts.title': { in: ['ts', 'vitest'] },
            'profile.city': 'NYC',
            role: { in: ['admin', 'user'] },
          },
          { includeSearchFields: true },
        );

        expect(valid).toEqual({
          [QUERY_NAMES.SRC]:
            'active:true;age:18,65;createdAt:2026-01-01;name:Alice;posts.likes:10;posts.title:ts,vitest;profile.city:NYC;role:admin,user',
          [QUERY_NAMES.SFI]:
            'active:=;age:between;createdAt:>=;name:like;posts.likes:>;posts.title:in;profile.city:=;role:in',
        });

        // @ts-expect-error number field cannot take string shorthand
        Search.build<User>({ age: '18' });

        // @ts-expect-error number field cannot take string in `in`
        Search.build<User>({ age: { in: ['18'] } });

        // @ts-expect-error number field cannot use `like`
        Search.build<User>({ age: { like: '18' } });

        // @ts-expect-error boolean field cannot take number or `gt`
        Search.build<User>({ active: { gt: 1 } });

        // @ts-expect-error string union field rejects invalid literal
        Search.build<User>({ role: 'guest' });

        // @ts-expect-error nested array number field rejects string
        Search.build<User>({ 'posts.likes': { gte: '10' } });

        // @ts-expect-error nested optional object string field rejects number
        Search.build<User>({ 'profile.city': 123 });

        // @ts-expect-error Date field maps to string, rejecting boolean
        Search.build<User>({ createdAt: false });

        // @ts-expect-error object/array path cannot be searched with scalar
        Search.build<User>({ posts: 'anything' });

        expect(() =>
          // @ts-expect-error btw tuple cannot contain undefined
          Search.build<User>({ age: { btw: [18, undefined] } }),
        ).toThrow(ParamsL5ValidationError);

        expect(() =>
          // @ts-expect-error btw tuple cannot have both elements undefined
          Search.build<User>({ age: { btw: [undefined, undefined] } }),
        ).toThrow(ParamsL5ValidationError);

        expect(() =>
          // @ts-expect-error btw tuple cannot contain null
          Search.build<User>({ name: { btw: ['a', null] } }),
        ).toThrow(ParamsL5ValidationError);

        // Untyped btw also rejects null/undefined elements
        expect(() =>
          // @ts-expect-error btw tuple cannot contain undefined
          Search.build({ age: { btw: [18, undefined] } }),
        ).toThrow(ParamsL5ValidationError);
        expect(() =>
          // @ts-expect-error btw tuple cannot have both elements undefined
          Search.build({ age: { btw: [undefined, undefined] } }),
        ).toThrow(ParamsL5ValidationError);

        // Whole btw/in value can still be omitted as undefined/null, and in accepts empty arrays
        expect(
          Search.build<User>({
            age: { btw: undefined },
            name: { btw: null },
            role: { in: [] },
          }),
        ).toEqual({
          [QUERY_NAMES.SRC]: undefined,
          [QUERY_NAMES.SFI]: undefined,
        });
      });

      test('should allow commas in scalar string values', () => {
        result = Search.build(
          {
            address: '123 Main St, Apt 4',
            name: { like: 'Doe, John' },
          },
          { includeSearchFields: true },
        );

        expect(result).toEqual({
          [QUERY_NAMES.SRC]: 'address:123 Main St, Apt 4;name:Doe, John',
          [QUERY_NAMES.SFI]: 'address:=;name:like',
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return empty result when called with undefined, null, no arguments, or empty object', () => {
        expected = {
          [QUERY_NAMES.SRC]: undefined,
          [QUERY_NAMES.SFI]: undefined,
        };

        expect(Search.build()).toEqual(expected);
        expect(Search.build(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(Search.build(null, { logger: noOpLogger })).toEqual(expected);
        expect(Search.build({}, { logger: noOpLogger })).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with field, value, and issues for non-object input', () => {
        input = 'invalid';
        let caught: unknown;

        try {
          Search.build(input, { logger: noOpLogger });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.field).toBe(QUERY_NAMES.SRC);
          expect(caught.value).toBe(input);
          expect(caught.message).toBe(
            'Search: value must be a object, got string instead',
          );
          expect(caught.issues).toEqual([
            {
              field: QUERY_NAMES.SRC,
              message: 'Search: value must be a object, got string instead',
              value: input,
            },
          ]);
        }
      });

      test.each([
        { label: 'number', value: 123, type: 'number' },
        { label: 'boolean', value: true, type: 'boolean' },
        { label: 'array', value: [['name', 'John']], type: 'Array' },
        { label: 'Date', value: new Date(), type: 'object' },
        { label: 'NaN', value: Number.NaN, type: 'NaN' },
      ])('should throw error when called with $label', ({ value, type }) => {
        expect(() =>
          Search.build(value as never, { logger: noOpLogger }),
        ).toThrow(`Search: value must be a object, got ${type} instead`);
      });

      test('should ignore null and undefined values (including inside condition objects and empty "in" arrays)', () => {
        input = {
          emptyIn: { in: [] },
          ignored: null,
          missing: undefined,
          nestedNull: { like: null },
          nestedUndefined: { in: undefined },
          nullishIn: { in: [null, undefined] },
          status: 'active',
        };
        expected = {
          [QUERY_NAMES.SRC]: 'status:active',
          [QUERY_NAMES.SFI]: undefined,
        };

        result = Search.build(input, { logger: noOpLogger });

        expect(result).toEqual(expected);
      });

      test('should throw ParamsL5ValidationError with issues for invalid entries and options by default', () => {
        input = {
          '': 'emptyKey',
          badBase: '',
          badBtw: { btw: [1] },
          badCond: { invalid: 'x' },
          badIn: { in: ['active', ''] },
          directArr: ['a'],
        };
        let caught: unknown;

        try {
          Search.build(input, {
            defaultCondition: 'invalid' as never,
            logger: noOpLogger,
          });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.issues.map((issue) => issue.field)).toEqual([
            'search.defaultCondition',
            'search[0]',
            'search.badBase',
            'search.badBtw',
            'search.badCond',
            'search.badIn',
            'search.directArr',
          ]);
        }
      });

      test('should report descriptive error messages for empty strings, non-finite numbers, and invalid btw items', () => {
        const res = Search.safe(
          {
            blankCond: { like: '   ' },
            btwEmpty: { btw: ['', 'z'] },
            btwUndef: { btw: [1, undefined] as never },
            emptyBase: '',
            emptyIn: { in: ['active', ''] },
            infVal: Number.POSITIVE_INFINITY,
          },
          { logger: noOpLogger },
        );

        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.issues.map((issue) => issue.message)).toEqual([
            'Search: ignoring value: expected BaseValue, got empty string instead',
            'Search: ignoring value: expected BaseValue, got empty string instead',
            'Search: ignoring value: expected BaseValue, got undefined instead',
            'Search: ignoring value: expected BaseValue, got empty string instead',
            'Search: ignoring value: expected BaseValue, got empty string instead',
            'Search: ignoring value: expected BaseValue, got Infinity instead',
          ]);
        }
      });

      test('should ignore empty/whitespace values and invalid entries when strict is false', () => {
        input = {
          '': 'a',
          '   ': 'b',
          badCond: { invalid: 'x' },
          blank: '   ',
          btwInvalidItem: { btw: ['2023-01-01', null] },
          btwLong: { btw: [1, 2, 3] },
          btwNonArray: { btw: '2023-01-01' },
          btwShort: { btw: [1] },
          directArray: ['a', 'b'],
          empty: '',
          emptyCond: {},
          ignored: null,
          inEmpty: { in: [] },
          inInvalidItems: { in: [null, undefined, {}] },
          inNonArray: { in: 'active' },
          missing: undefined,
          multiCond: { eq: 'a', like: 'b' },
          nestedNull: { like: null },
          nestedUndefined: { in: undefined },
          scalarWithArray: { eq: ['a', 'b'] },
          status: 'active',
        };
        expected = {
          [QUERY_NAMES.SRC]: 'status:active',
          [QUERY_NAMES.SFI]: undefined,
        };

        result = Search.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should return empty result when strict is false and only array values remain', () => {
        input = {
          directArray: ['a', 'b'],
          scalarWithArray: { eq: ['a', 'b'] },
        };
        expected = {
          [QUERY_NAMES.SRC]: undefined,
          [QUERY_NAMES.SFI]: undefined,
        };

        result = Search.build(input, { logger: noOpLogger, strict: false });

        expect(result).toEqual(expected);
      });

      test('should fall back to "=" when defaultCondition is invalid and strict is false', () => {
        result = Search.build(
          { name: 'John' },
          {
            defaultCondition: 'invalid' as never,
            includeSearchFields: true,
            logger: noOpLogger,
            strict: false,
          },
        );

        expect(result).toEqual({
          [QUERY_NAMES.SRC]: 'name:John',
          [QUERY_NAMES.SFI]: 'name:=',
        });
      });

      test.each([
        {
          desc: 'key containing semicolon',
          inputObj: { 'name;role': 'John' },
          expectedFields: ['search[0]'],
        },
        {
          desc: 'key containing colon',
          inputObj: { 'name:role': 'John' },
          expectedFields: ['search[0]'],
        },
        {
          desc: 'key containing comma',
          inputObj: { 'name,role': 'John' },
          expectedFields: ['search[0]'],
        },
        {
          desc: 'shorthand value containing colon',
          inputObj: { title: 'Alpha: Part 1' },
          expectedFields: ['search.title'],
        },
        {
          desc: 'shorthand value containing semicolon',
          inputObj: { title: 'Part 1; Special' },
          expectedFields: ['search.title'],
        },
        {
          desc: 'condition value containing colon or semicolon',
          inputObj: { url: { like: 'https://example.com' } },
          expectedFields: ['search.url'],
        },
        {
          desc: 'in item containing comma',
          inputObj: { status: { in: ['active,admin', 'pending'] } },
          expectedFields: ['search.status'],
        },
        {
          desc: 'in item containing semicolon or colon',
          inputObj: { status: { in: ['a;b', 'c:d'] } },
          expectedFields: ['search.status'],
        },
        {
          desc: 'btw item containing comma, colon, or semicolon',
          inputObj: { date: { btw: ['2026-01-01,00', '2026-12-31'] } },
          expectedFields: ['search.date'],
        },
      ])(
        'should throw ParamsL5ValidationError for $desc by default',
        ({ inputObj, expectedFields }) => {
          let caught: unknown;

          try {
            Search.build(inputObj as never, { logger: noOpLogger });
          } catch (err) {
            caught = err;
          }

          expect(caught).toBeInstanceOf(ParamsL5ValidationError);
          if (caught instanceof ParamsL5ValidationError) {
            expect(caught.issues.map((issue) => issue.field)).toEqual(
              expectedFields,
            );
          }
        },
      );

      test('should drop entries with delimiter collisions when strict is false', () => {
        result = Search.build(
          {
            'bad;key': 'ok',
            badBtw: { btw: ['a,b', 'c'] },
            badCond: { like: 'a;b' },
            badInAll: { in: ['a,b', 'c:d'] },
            badScalar: 'Alpha: Part 1',
            partialIn: { in: ['active', 'bad,item', 'pending'] },
            status: 'active',
          } as never,
          { logger: noOpLogger, strict: false },
        );

        expect(result).toEqual({
          [QUERY_NAMES.SRC]: 'partialIn:active,pending;status:active',
          [QUERY_NAMES.SFI]: undefined,
        });
      });
    });

    describe('Search logging', () => {
      test('should not log anything for valid values', () => {
        Search.build({ name: { like: 'John' } }, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined or null', () => {
        Search.build(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Search: no value given');

        vi.clearAllMocks();

        Search.build(null, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Search: no value given');
      });

      test('should log info when called with empty object', () => {
        Search.build({}, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Search: no values given');
      });

      test('should log error when called with non-object', () => {
        expect(() => Search.build('invalid' as never, { logger })).toThrow(
          ParamsL5ValidationError,
        );

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Search: value must be a object, got string instead',
        );
      });

      test('should log warn for invalid key, condition, btw size, and array condition mismatch when strict is false', () => {
        Search.build(
          {
            '': 'emptyKey',
            badCond: { foo: 'bar' } as never,
            badBtw: { btw: [1] } as never,
            directArr: ['a'] as never,
            eqArr: { eq: ['a'] } as never,
            name: 'John',
          },
          { logger, strict: false },
        );

        expect(warn).toHaveBeenCalledTimes(5);
        expect(warn).toHaveBeenNthCalledWith(
          1,
          'Search: must have keys as non-empty strings, but got empty string at index 0 instead',
        );
        expect(warn).toHaveBeenNthCalledWith(
          2,
          'Search: ignoring value: invalid condition value, got foo',
        );
        expect(warn).toHaveBeenNthCalledWith(
          3,
          "Search: ignoring array value: expected 2 elements for 'between', got 1 at index 2 instead",
        );
        expect(warn).toHaveBeenNthCalledWith(
          4,
          "Search: ignoring array value: missing condition, expected 'in' or 'between'",
        );
        expect(warn).toHaveBeenNthCalledWith(
          5,
          "Search: ignoring array value: invalid condition, expected 'in' or 'between' at index 4",
        );
      });

      test('should log info for invalid base values and when no values remain when strict is false', () => {
        Search.build({ name: '' }, { logger, strict: false });

        expect(info).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenNthCalledWith(
          1,
          'Search: ignoring value: expected BaseValue, got empty string instead',
        );
        expect(info).toHaveBeenNthCalledWith(
          2,
          'Search: no values remaining to parse',
        );
      });

      test('should log warn for delimiter collisions when strict is false', () => {
        Search.build(
          {
            'bad:key': 'ok',
            badBtw: { btw: ['a,b', 'c'] },
            badScalar: 'a;b',
            status: 'active',
          } as never,
          { logger, strict: false },
        );

        expect(warn).toHaveBeenCalledTimes(3);
        expect(warn).toHaveBeenNthCalledWith(
          1,
          'Search: key must not contain reserved delimiters (;, :, or ,)',
        );
        expect(warn).toHaveBeenNthCalledWith(
          2,
          'Search: value must not contain reserved delimiters (;, :, or ,)',
        );
        expect(warn).toHaveBeenNthCalledWith(
          3,
          'Search: value must not contain reserved delimiters (; or :)',
        );
      });
    });
  });

  describe('safe', () => {
    describe('formatting', () => {
      test('should return success result for valid object input', () => {
        result = Search.safe(
          {
            age: { gte: 18 },
            date: { btw: ['2023-01-01', '2023-12-31'] },
            name: 'John',
            status: { in: ['active', 'pending'] },
          },
          { includeSearchFields: true },
        );

        expect(result).toEqual({
          data: {
            [QUERY_NAMES.SRC]:
              'age:18;date:2023-01-01,2023-12-31;name:John;status:active,pending',
            [QUERY_NAMES.SFI]: 'age:>=;date:between;name:=;status:in',
          },
          success: true,
        });
      });
    });

    describe('validations and edge cases', () => {
      test('should return success result with undefined fields for undefined, null, no args, or {}', () => {
        expected = {
          data: { [QUERY_NAMES.SRC]: undefined, [QUERY_NAMES.SFI]: undefined },
          success: true,
        };

        expect(Search.safe()).toEqual(expected);
        expect(Search.safe(undefined, { logger: noOpLogger })).toEqual(
          expected,
        );
        expect(Search.safe(null, { logger: noOpLogger })).toEqual(expected);
        expect(Search.safe({}, { logger: noOpLogger })).toEqual(expected);
      });

      test('should return failure result for non-object input', () => {
        input = ['name', 'John'];

        result = Search.safe(input, { logger: noOpLogger });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(result.error.field).toBe(QUERY_NAMES.SRC);
          expect(result.error.value).toBe(input);
          expect(result.error.message).toBe(
            'Search: value must be a object, got Array instead',
          );
          expect(result.error.issues).toEqual([
            {
              field: QUERY_NAMES.SRC,
              message: 'Search: value must be a object, got Array instead',
              value: input,
            },
          ]);
        }
      });

      test('should return failure result for invalid field entries under strict mode', () => {
        const safeResult = Search.safe(
          {
            bad: { invalid: 'x' } as never,
            name: 'John',
          },
          { includeSearchFields: true, logger: noOpLogger },
        );

        expect(safeResult.success).toBe(false);
        if (!safeResult.success) {
          expect(safeResult.error).toBeInstanceOf(ParamsL5ValidationError);
          expect(safeResult.error.issues.map((issue) => issue.field)).toEqual([
            'search.bad',
          ]);
        }
      });

      test('should filter invalid field entries when strict is false and return success result', () => {
        result = Search.safe(
          {
            bad: { invalid: 'x' } as never,
            name: 'John',
          },
          { includeSearchFields: true, logger: noOpLogger, strict: false },
        );

        expect(result).toEqual({
          data: {
            [QUERY_NAMES.SRC]: 'name:John',
            [QUERY_NAMES.SFI]: 'name:=',
          },
          success: true,
        });
      });
    });

    describe('Search logging', () => {
      test('should not log anything for valid values', () => {
        Search.safe({ name: 'John' }, { logger });

        expect(info).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });

      test('should log info when called with undefined, null, or empty object', () => {
        Search.safe(undefined, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Search: no value given');

        vi.clearAllMocks();

        Search.safe({}, { logger });
        expect(info).toHaveBeenCalledExactlyOnceWith('Search: no values given');
      });

      test('should log error when called with non-object', () => {
        Search.safe('invalid' as never, { logger });

        expect(error).toHaveBeenCalledExactlyOnceWith(
          'Search: value must be a object, got string instead',
        );
      });
    });
  });
});
