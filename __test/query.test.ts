import { describe, expect, test } from 'vitest';

import { QUERY_NAMES } from '#/constants';
import { query } from '#gen/query';

describe('query function', () => {
  test('should compile parameters in alphabetical order', () => {
    const input = {
      [QUERY_NAMES.SRC]: 'status:active',
      [QUERY_NAMES.FLT]: 'id;name',
      [QUERY_NAMES.LMT]: '10',
    };

    const result = query(input);

    expect(result).toBe('filter=id%3Bname&limit=10&search=status%3Aactive');
  });

  test('should omit undefined and empty values', () => {
    const input = {
      [QUERY_NAMES.FLT]: 'id;name',
      [QUERY_NAMES.LMT]: undefined,
      [QUERY_NAMES.PAG]: '',
    };

    const result = query(input);

    expect(result).toBe('filter=id%3Bname');
  });

  test('should ignore keys not recognized as valid query parameter keys', () => {
    const input = {
      [QUERY_NAMES.FLT]: 'id;name',
      // @ts-expect-error Testing invalid key
      invalidKey: 'should_be_ignored',
    };

    const result = query(input);

    expect(result).toBe('filter=id%3Bname');
  });

  test('should return an empty string when given an empty object', () => {
    expect(query({})).toBe('');
  });
});
