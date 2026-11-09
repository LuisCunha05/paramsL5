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

export const QUERY_NAMES = Object.freeze({
  FLT: 'filter',
  INC: 'include',
  LMT: 'limit',
  OBY: 'orderBy',
  PAG: 'page',
  SBY: 'sortedBy',
  SCR: 'searchCriteria',
  SFI: 'searchFields',
  SJO: 'searchJoin',
  SRC: 'search',
  WTH: 'with',
} as const);

export const QUERY_LABELS = Object.freeze({
  FLT: 'Filter',
  INC: 'Include',
  LMT: 'Limit',
  OBY: 'OrderBySortBy',
  PAG: 'Page',
  SBY: 'SortBy',
  SCR: 'SearchCriteria',
  SFI: 'SearchFields',
  SJO: 'SearchJoin',
  SRC: 'Search',
  WTH: 'With',
} as const);
