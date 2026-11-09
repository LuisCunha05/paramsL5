export const CONDITIONS = Object.freeze({
  BTW: 'between',
  DIFF: '!=',
  EQ: '=',
  GT: '>',
  GTE: '>=',
  ILIKE: 'ilike',
  IN: 'in',
  LIKE: 'like',
  LT: '<',
  LTE: '<=',
} as const);

export const SEARCH_JOIN = Object.freeze({
  AND: 'and',
  OR: 'or',
} as const);

export const SORT_BY = Object.freeze({
  ASC: 'asc',
  DESC: 'desc',
} as const);
