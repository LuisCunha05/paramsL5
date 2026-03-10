export const URL_ENCODED_CHARS = Object.freeze({
  /** Example: `,` */
  COMMA: '%2C',
  /** Example: `:` */
  COLON: '%3A',
  /** Example: `=` */
  EQUALS: '%3D',
  /** Example: `;` */
  SEMICOLON: '%3B',
  /** Example: `>` */
  GREATER_THAN: '%3E',
  /** Example: `<` */
  LESS_THAN: '%3C',
  /** Example: ` ` (Space) */
  SPACE: '%20',
  /** Example: `&` */
  AMPERSAND: '%26',
  /** Example: `#` */
  HASHTAG: '%23',
  /** Example: `?` */
  QUESTION_MARK: '%3F',
  /** Example: `/` */
  SLASH: '%2F',
  /** Example: `@` */
  AT: '%40',
  /** Example: `+` */
  PLUS: '%2B',
  /** Example: `$` */
  DOLLAR: '%24',
  /** Example: `%` */
  PERCENT: '%25',
  /** Example: `^` */
  CARET: '%5E',
  /** Example: `|` */
  PIPE: '%7C',
  /** Example: `~` */
  TILDE: '%7E',
  /** Example: '`' */
  BACKTICK: '%60',
  /** Example: `"` */
  QUOTE: '%22',
  /** Example: `'` */
  APOSTROPHE: '%27',
  /** Example: `[` */
  LEFT_BRACKET: '%5B',
  /** Example: `]` */
  RIGHT_BRACKET: '%5D',
  /** Example: `{` */
  LEFT_BRACE: '%7B',
  /** Example: `}` */
  RIGHT_BRACE: '%7D',
} as const)

export const CONDITIONS = Object.freeze({
  EQ: '=',
  GTE: '>=',
  LTE: '<=',
  GT: '>',
  LT: '<',
  DIFF: '!=',
  IN: 'in',
  LIKE: 'like',
  ILIKE: 'ilike',
  BTW: 'between',
} as const)

export const SEARCH_JOIN = Object.freeze({
  AND: 'and',
  OR: 'or',
} as const)

export const SORT_BY = Object.freeze({
  ASC: 'asc',
  DESC: 'desc',
} as const)
