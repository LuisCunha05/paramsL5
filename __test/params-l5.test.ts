import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import {
  CONDITIONS,
  ParamsL5,
  ParamsL5ValidationError,
  type TResult,
  type TValidationIssue,
} from '#/index';

import { URL_ENCODED_CHARS as URC } from './constants';

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

afterEach(() => {
  vi.clearAllMocks();
});

describe('ParamsL5 class', () => {
  describe('exports', () => {
    test('should export ParamsL5, ParamsL5ValidationError, and type definitions from index', () => {
      const err = ParamsL5ValidationError.fromField('limit', 'invalid', -1);
      const res: TResult<string> = { error: err, success: false };
      const issue: TValidationIssue = {
        field: 'limit',
        message: 'invalid',
        value: -1,
      };

      expect(ParamsL5).toBeDefined();
      expect(err).toBeInstanceOf(ParamsL5ValidationError);
      expect(res.success).toBe(false);
      expect(issue.field).toBe('limit');
    });
  });

  describe('static methods', () => {
    test('ParamsL5.build should generate query params without options', () => {
      const res = ParamsL5.build({
        filter: ['id', 'name'],
        limit: 10,
        search: { status: 'active' },
      });

      expect(res.filter).toBe('id;name');
      expect(res.limit).toBe('10');
      expect(res.search).toBe('status:active');
      expect(res.toParams()).toBe(
        `filter=id${URC.SEMICOLON}name&limit=10&page=1&search=status${URC.COLON}active`,
      );
    });

    test('ParamsL5.build should accept ParamsL5Options', () => {
      const res = ParamsL5.build(
        { page: 2 },
        { defaultOptions: { limit: 25, searchJoin: 'or' } },
      );

      expect(res.toParams()).toBe('limit=25&page=2&searchJoin=or');
    });

    test('ParamsL5.safe should return success result for valid params', () => {
      const res = ParamsL5.safe({
        filter: ['id'],
        limit: 5,
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.filter).toBe('id');
        expect(res.data.limit).toBe('5');
        expect(res.data.toParams()).toBe('filter=id&limit=5&page=1');
      }
    });

    test('ParamsL5.safe should aggregate issues from multiple invalid generators', () => {
      const res = ParamsL5.safe({
        filter: ['id', '' as never],
        limit: -5,
        page: 0,
        searchJoin: 'xor' as never,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBeInstanceOf(ParamsL5ValidationError);
        expect(res.error.issues.length).toBe(4);
        expect(res.error.issues.map((issue) => issue.field)).toEqual([
          'filter[1]',
          QUERY_NAMES.LMT,
          QUERY_NAMES.PAG,
          QUERY_NAMES.SJO,
        ]);
      }
    });
  });

  describe('instance (constructor configuration)', () => {
    describe('global', () => {
      test('should apply all defaultOptions when omitted in params', () => {
        input = {
          orderBySortBy: { name: true },
          search: { name: 'john' },
        };
        expected = `limit=77&orderBy=name&page=2&search=name${URC.COLON}john&searchFields=name${URC.COLON}like&searchJoin=or&sortedBy=desc`;

        const client = new ParamsL5({
          defaultOptions: {
            includeSearchFields: true,
            limit: 77,
            page: 2,
            searchCondition: CONDITIONS.LIKE,
            searchJoin: 'or',
            sortBy: 'desc',
          },
          logging: { logLevel: { error: false } },
        });

        result = client.build(input);

        expect(result.toParams()).toBe(expected);
      });
    });

    describe('limit', () => {
      test('should use default limit when defaultOptions is provided', () => {
        const client = new ParamsL5({
          defaultOptions: { limit: 77 },
          logging: { logLevel: { error: false } },
        });

        expect(client.build().limit).toBe('77');
      });

      test('should prioritize limit from params over defaultOptions', () => {
        const client = new ParamsL5({
          defaultOptions: { limit: 77 },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ limit: 10 }).limit).toBe('10');
      });
    });

    describe('page', () => {
      test('should use default page when defaultOptions is provided', () => {
        const client = new ParamsL5({
          defaultOptions: { page: 2 },
          logging: { logLevel: { error: false } },
        });

        expect(client.build().page).toBe('2');
      });

      test('should prioritize page from params over defaultOptions', () => {
        const client = new ParamsL5({
          defaultOptions: { page: 2 },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ page: 3 }).page).toBe('3');
      });
    });

    describe('sortBy', () => {
      test('should use default sortBy when defaultOptions is provided', () => {
        const client = new ParamsL5({
          defaultOptions: { sortBy: 'desc' },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ orderBySortBy: { name: true } }).sortedBy).toBe(
          'desc',
        );
      });

      test('should prioritize sortBy from params over defaultOptions', () => {
        const client = new ParamsL5({
          defaultOptions: { sortBy: 'desc' },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ orderBySortBy: { name: 'asc' } }).sortedBy).toBe(
          'asc',
        );
      });
    });

    describe('searchJoin', () => {
      test('should use default searchJoin when defaultOptions is provided', () => {
        const client = new ParamsL5({
          defaultOptions: { searchJoin: 'or' },
          logging: { logLevel: { error: false } },
        });

        expect(client.build().searchJoin).toBe('or');
      });

      test('should prioritize searchJoin from params over defaultOptions', () => {
        const client = new ParamsL5({
          defaultOptions: { searchJoin: 'or' },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ searchJoin: 'and' }).searchJoin).toBe('and');
      });
    });

    describe('searchCondition', () => {
      test('should use default searchCondition when defaultOptions is provided', () => {
        expected = `limit=1&page=1&search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`;

        const client = new ParamsL5({
          defaultOptions: {
            includeSearchFields: true,
            searchCondition: CONDITIONS.GTE,
          },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ search: { age: 18 } }).toParams()).toBe(expected);
      });

      test('should prioritize searchCondition from params over defaultOptions', () => {
        expected = `limit=1&page=1&search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.LESS_THAN}${URC.EQUALS}`;

        const client = new ParamsL5({
          defaultOptions: {
            includeSearchFields: true,
            searchCondition: CONDITIONS.GTE,
          },
        });

        expect(client.build({ search: { age: { lte: 18 } } }).toParams()).toBe(
          expected,
        );
      });
    });

    describe('includeSearchFields', () => {
      test('should omit searchFields by default when includeSearchFields is not set', () => {
        const client = new ParamsL5({
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ search: { age: { gte: 18 } } }).toParams()).toBe(
          `limit=1&page=1&search=age${URC.COLON}18`,
        );
      });

      test('should include searchFields when defaultOptions has includeSearchFields true', () => {
        const client = new ParamsL5({
          defaultOptions: { includeSearchFields: true },
          logging: { logLevel: { error: false } },
        });

        expect(client.build({ search: { age: { gte: 18 } } }).toParams()).toBe(
          `limit=1&page=1&search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`,
        );
      });

      test('should prioritize includeSearchFields from params over defaultOptions', () => {
        const client = new ParamsL5({
          defaultOptions: { includeSearchFields: true },
          logging: { logLevel: { error: false } },
        });

        expect(
          client
            .build({
              includeSearchFields: false,
              search: { age: { gte: 18 } },
            })
            .toParams(),
        ).toBe(`limit=1&page=1&search=age${URC.COLON}18`);
      });
    });

    describe('withCount', () => {
      test('should generate withCount query param correctly', () => {
        const client = new ParamsL5({
          logging: { logLevel: { error: false } },
        });

        const res = client.build({ withCount: ['comments', 'likes'] });

        expect(res.withCount).toBe('comments;likes');
        expect(res.toParams()).toBe(
          `limit=1&page=1&withCount=comments${URC.SEMICOLON}likes`,
        );
      });
    });

    describe('strict mode and issue aggregation', () => {
      test('should throw aggregated ParamsL5ValidationError by default (strict: true)', () => {
        const client = new ParamsL5();
        let caught: unknown;

        try {
          client.build({
            filter: ['id', 123 as never],
            limit: -1,
            orderBySortBy: { name: 'bad' as never },
            page: 0,
            search: { age: { btw: [1] as never } },
          });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ParamsL5ValidationError);
        if (caught instanceof ParamsL5ValidationError) {
          expect(caught.issues.map((issue) => issue.field)).toEqual([
            'filter[1]',
            QUERY_NAMES.LMT,
            'orderBy.name',
            QUERY_NAMES.PAG,
            'search.age',
          ]);
        }
      });

      test('should drop invalid fields and fall back to defaults when strict is false', () => {
        const client = new ParamsL5({
          defaultOptions: { limit: 15, searchJoin: 'and' },
          strict: false,
        });

        const res = client.build({
          filter: ['id', 123 as never, ''],
          limit: -5,
          orderBySortBy: {
            '': 'asc' as never,
            bad: 'invalid' as never,
            name: 'desc',
          },
          page: 0,
          search: { bad: { foo: 'bar' } as never, status: 'active' },
          searchJoin: 'xor' as never,
        });

        expect(res.filter).toBe('id');
        expect(res.limit).toBe('15');
        expect(res.orderBy).toBe('name');
        expect(res.sortedBy).toBe('desc');
        expect(res.page).toBe('1');
        expect(res.search).toBe('status:active');
        expect(res.searchJoin).toBe('and');
      });

      test('instance.safe should return aggregated failure under strict: true and success under strict: false', () => {
        const strictClient = new ParamsL5();
        const failed = strictClient.safe({ limit: -1, page: 0 });
        expect(failed.success).toBe(false);
        if (!failed.success) {
          expect(failed.error.issues.map((i) => i.field)).toEqual([
            QUERY_NAMES.LMT,
            QUERY_NAMES.PAG,
          ]);
        }

        const permissiveClient = new ParamsL5({ strict: false });
        const ok = permissiveClient.safe({ limit: -1, page: 0 });
        expect(ok.success).toBe(true);
        if (ok.success) {
          expect(ok.data.limit).toBe('1');
          expect(ok.data.page).toBe('1');
        }
      });
    });

    describe('for method', () => {
      interface UserModel {
        id: string;
        name: string;
        email: string;
        profile: {
          avatar: string;
        };
        posts: {
          title: string;
        };
      }

      test('should generate query params using client.for<Model>().build and ParamsL5.for<Model>().safe', () => {
        const client = new ParamsL5({
          defaultOptions: { limit: 15 },
          logging: { logLevel: { error: false } },
        });

        const res = client.for<UserModel>().build({
          filter: ['id', 'email'],
          include: ['profile', 'posts'],
          orderBySortBy: { name: 'asc' },
          withCount: ['posts'],
        });

        expect(res.filter).toBe('id;email');
        expect(res.include).toBe('profile,posts');
        expect(res.withCount).toBe('posts');
        expect(res.orderBy).toBe('name');
        expect(res.sortedBy).toBe('asc');
        expect(res.limit).toBe('15');

        const safeRes = ParamsL5.for<UserModel>({
          defaultOptions: { limit: 20 },
        }).safe({
          filter: ['id'],
        });

        expect(safeRes.success).toBe(true);
        if (safeRes.success) {
          expect(safeRes.data.filter).toBe('id');
          expect(safeRes.data.limit).toBe('20');
        }
      });

      test('should reject duplicate paths and invalid types at compile-time', () => {
        const client = new ParamsL5({
          logging: { logLevel: { error: false } },
        });

        const valid = client.for<UserModel>().build({
          filter: ['id', 'email'],
          include: ['profile', 'posts'],
          orderBySortBy: {
            id: 'desc',
            name: 'asc',
            'posts:author_id|title': 'desc',
            'posts|title': 'asc',
          },
          withCount: ['posts'],
        });
        expect(valid.include).toBe('profile,posts');
        expect(valid.withCount).toBe('posts');

        // @ts-expect-error Duplicate path 'profile'
        client.for<UserModel>().build({ include: ['profile', 'profile'] });

        // @ts-expect-error Duplicate path 'id'
        client.for<UserModel>().build({ filter: ['id', 'id'] });

        // @ts-expect-error Duplicate path 'posts'
        client.for<UserModel>().build({ withCount: ['posts', 'posts'] });

        const invalidSortRes = client.for<UserModel>().safe({
          orderBySortBy: {
            // @ts-expect-error Invalid sort direction 'invalid'
            name: 'invalid',
          },
        });
        expect(invalidSortRes.success).toBe(false);
      });
    });
  });
});
