import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createClient } from '#/client';
import { CONDITIONS } from '#/constants';

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

describe('createClient function', () => {
  describe('global', () => {
    test('should return all default properties correctly without params', () => {
      input = {
        orderBySortBy: [['name']],
        search: { name: 'john' },
      };
      expected = `limit=77&orderBy=name&page=2&search=name${URC.COLON}john&searchFields=name${URC.COLON}like&searchJoin=or&sortedBy=desc`;

      const paramsL5 = createClient({
        defaultOptions: {
          limit: 77,
          page: 2,
          sortBy: 'desc',
          searchJoin: 'or',
          searchCondition: CONDITIONS.LIKE,
          includeSearchFields: true,
        },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.toParams()).toBe(expected);
    });
  });

  describe('limit', () => {
    test('should change the default limit when defaultOptions is provided', () => {
      expected = '77';

      const paramsL5 = createClient({
        defaultOptions: { limit: 77 },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5();

      expect(result?.limit).toBe(expected);
    });

    test('should prioritize limit from params over defaultOptions', () => {
      input = { limit: 10 };
      expected = '10';

      const paramsL5 = createClient({
        defaultOptions: { limit: 77 },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.limit).toBe(expected);
    });
  });

  describe('page', () => {
    test('should change the default page when defaultOptions is provided', () => {
      expected = '2';

      const paramsL5 = createClient({
        defaultOptions: { page: 2 },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5();

      expect(result?.page).toBe(expected);
    });

    test('should prioritize page from params over defaultOptions', () => {
      input = { page: 3 };
      expected = '3';

      const paramsL5 = createClient({
        defaultOptions: { page: 2 },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.page).toBe(expected);
    });
  });

  describe('sortBy', () => {
    test('should change the default sortBy when defaultOptions is provided', () => {
      input = { orderBySortBy: [['name']] };
      expected = 'desc';

      const paramsL5 = createClient({
        defaultOptions: { sortBy: 'desc' },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.sortedBy).toBe(expected);
    });

    test('should prioritize sortBy from params over defaultOptions', () => {
      input = { orderBySortBy: [['name', 'asc']] };
      expected = 'asc';

      const paramsL5 = createClient({
        defaultOptions: { sortBy: 'desc' },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.sortedBy).toBe(expected);
    });
  });

  describe('searchJoin', () => {
    test('should change the default searchJoin when defaultOptions is provided', () => {
      expected = 'or';

      const paramsL5 = createClient({
        defaultOptions: { searchJoin: 'or' },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5();

      expect(result?.searchJoin).toBe(expected);
    });

    test('should prioritize searchJoin from params over defaultOptions', () => {
      input = { searchJoin: 'and' };
      expected = 'and';

      const paramsL5 = createClient({
        defaultOptions: { searchJoin: 'or' },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.searchJoin).toBe(expected);
    });
  });

  describe('searchCondition', () => {
    test('should change the default searchCondition when defaultOptions is provided', () => {
      input = { search: { age: 18 } };
      expected = `limit=1&page=1&search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`;

      const paramsL5 = createClient({
        defaultOptions: {
          searchCondition: CONDITIONS.GTE,
          includeSearchFields: true,
        },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.toParams()).toBe(expected);
    });

    test('should prioritize searchCondition from params over defaultOptions', () => {
      input = { search: { age: { lte: 18 } } };
      expected = `limit=1&page=1&search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.LESS_THAN}${URC.EQUALS}`;

      const paramsL5 = createClient({
        defaultOptions: {
          searchCondition: CONDITIONS.GTE,
          includeSearchFields: true,
        },
      });

      result = paramsL5(input);

      expect(result?.toParams()).toBe(expected);
    });
  });

  describe('includeSearchFields', () => {
    test('should omit searchFields by default when includeSearchFields is not set', () => {
      input = { search: { age: { gte: 18 } } };
      expected = `limit=1&page=1&search=age${URC.COLON}18`;

      const paramsL5 = createClient({
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.toParams()).toBe(expected);
    });

    test('should include searchFields when defaultOptions has includeSearchFields true', () => {
      input = { search: { age: { gte: 18 } } };
      expected = `limit=1&page=1&search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`;

      const paramsL5 = createClient({
        defaultOptions: { includeSearchFields: true },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.toParams()).toBe(expected);
    });

    test('should prioritize includeSearchFields from params over defaultOptions', () => {
      input = {
        search: { age: { gte: 18 } },
        includeSearchFields: false,
      };
      expected = `limit=1&page=1&search=age${URC.COLON}18`;

      const paramsL5 = createClient({
        defaultOptions: { includeSearchFields: true },
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.toParams()).toBe(expected);
    });
  });

  describe('withCount', () => {
    test('should generate withCount query param correctly', () => {
      input = { withCount: ['comments', 'likes'] };
      expected = `limit=1&page=1&withCount=comments${URC.SEMICOLON}likes`;

      const paramsL5 = createClient({
        logging: { logLevel: { error: false } },
      });

      result = paramsL5(input);

      expect(result?.withCount).toBe('comments;likes');
      expect(result?.toParams()).toBe(expected);
    });
  });

  describe('client.for method', () => {
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

    test('should generate query params using client.for<Model>()', () => {
      const client = createClient({
        defaultOptions: { limit: 15 },
        logging: { logLevel: { error: false } },
      });

      const res = client.for<UserModel>()({
        filter: ['id', 'email'],
        include: ['profile', 'posts'],
        withCount: ['posts'],
        orderBySortBy: [['name', 'asc']],
      });

      expect(res.filter).toBe('id;email');
      expect(res.include).toBe('profile,posts');
      expect(res.withCount).toBe('posts');
      expect(res.orderBy).toBe('name');
      expect(res.sortedBy).toBe('asc');
      expect(res.limit).toBe('15');
    });

    test('should reject duplicate paths and duplicate keys at compile-time', () => {
      const client = createClient({ logging: { logLevel: { error: false } } });

      // Valid call
      const valid = client.for<UserModel>()({
        filter: ['id', 'email'],
        include: ['profile', 'posts'],
        withCount: ['posts'],
        orderBySortBy: [
          ['name', 'asc'],
          ['id', 'desc'],
        ],
      });
      expect(valid.include).toBe('profile,posts');
      expect(valid.withCount).toBe('posts');

      // @ts-expect-error Duplicate path 'profile'
      client.for<UserModel>()({ include: ['profile', 'profile'] });

      // @ts-expect-error Duplicate path 'id'
      client.for<UserModel>()({ filter: ['id', 'id'] });

      // @ts-expect-error Duplicate path 'posts'
      client.for<UserModel>()({ withCount: ['posts', 'posts'] });

      client.for<UserModel>()({
        orderBySortBy: [
          ['name', 'asc'],
          // @ts-expect-error Duplicate key 'name'
          ['name', 'desc'],
        ],
      });
    });
  });
});
