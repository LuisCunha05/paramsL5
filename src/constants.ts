export const URL_ENCODED_CHARS = Object.freeze({
  /** Example: `&` */
  AMPERSAND: '%26',
  /** Example: `'` */
  APOSTROPHE: '%27',
  /** Example: `@` */
  AT: '%40',
  /** Example: '`' */
  BACKTICK: '%60',
  /** Example: `^` */
  CARET: '%5E',
  /** Example: `:` */
  COLON: '%3A',
  /** Example: `,` */
  COMMA: '%2C',
  /** Example: `$` */
  DOLLAR: '%24',
  /** Example: `=` */
  EQUALS: '%3D',
  /** Example: `>` */
  GREATER_THAN: '%3E',
  /** Example: `#` */
  HASHTAG: '%23',
  /** Example: `{` */
  LEFT_BRACE: '%7B',
  /** Example: `[` */
  LEFT_BRACKET: '%5B',
  /** Example: `<` */
  LESS_THAN: '%3C',
  /** Example: `%` */
  PERCENT: '%25',
  /** Example: `|` */
  PIPE: '%7C',
  /** Example: `+` */
  PLUS: '%2B',
  /** Example: `?` */
  QUESTION_MARK: '%3F',
  /** Example: `"` */
  QUOTE: '%22',
  /** Example: `}` */
  RIGHT_BRACE: '%7D',
  /** Example: `]` */
  RIGHT_BRACKET: '%5D',
  /** Example: `;` */
  SEMICOLON: '%3B',
  /** Example: `/` */
  SLASH: '%2F',
  /** Example: ` ` (Space) */
  SPACE: '%20',
  /** Example: `~` */
  TILDE: '%7E',
} as const);

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

export const LOG_LEVEL = Object.freeze({
  ERROR: 3,
  INFO: 1,
  NONE: 0,
  WARN: 2,
} as const);

export const MIN_PAGE = 0;
