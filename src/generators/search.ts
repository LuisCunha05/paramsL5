import { CONDITIONS, QUERY_LABELS, QUERY_NAMES } from '#/constants';
import {
  ParamsL5ValidationError,
  type TValidationIssue,
} from '#/errors/ParamsL5ValidationError';
import {
  msgInvalidBaseValue,
  msgInvalidBetweenSize,
  msgInvalidCondition,
  msgInvalidConditionArray,
  msgInvalidKey,
  msgItemNotArray,
  msgMissingConditionArray,
  msgMustBeObject,
  msgNoRemaining,
  msgNoValue,
  msgNoValues,
  msgReservedDelimiter,
} from '#/messages';
import type {
  OnlyOneKey,
  TBaseValue,
  TConditionKeys,
  TGenerator,
  TLogger,
  TPath,
  TPathValue,
  TResult,
  ToEnum,
} from '#/types';
import {
  isArray,
  isBaseValue,
  isConditionKey,
  isNonEmptyString,
  isObject,
  typeName,
  unwrap,
} from '#/utils';

export type TCondition = ToEnum<typeof CONDITIONS>;
export type TSearchValue<TValue extends TBaseValue = TBaseValue> = [
  TValue,
] extends [never]
  ? never
  : TValue | null | undefined;
type BetweenTuple<TValue> = readonly [TValue, TValue];

type TSearchBetweenValue<TValue extends TBaseValue = TBaseValue> = [
  TValue,
] extends [never]
  ? never
  :
      | (Extract<TValue, string> extends never
          ? never
          : BetweenTuple<Extract<TValue, string> | null | undefined>)
      | (Extract<TValue, number> extends never
          ? never
          : BetweenTuple<Extract<TValue, number> | null | undefined>)
      | null
      | undefined;

type TSearchInValue<TValue extends TBaseValue = TBaseValue> = [TValue] extends [
  never,
]
  ? never
  : readonly (TValue | null | undefined)[] | null | undefined;

type TSearchableValue<TValue> = unknown extends TValue
  ? TBaseValue
  : Exclude<TValue, null | undefined> extends infer TNormalized
    ? TNormalized extends TBaseValue
      ? TNormalized
      : TNormalized extends Date
        ? string
        : never
    : never;

type TConditionMap<TValue extends TBaseValue = TBaseValue> = {
  [TKey in Lowercase<TConditionKeys>]: TKey extends 'btw'
    ? TSearchBetweenValue<Exclude<TValue, boolean>>
    : TKey extends 'in'
      ? TSearchInValue<Exclude<TValue, boolean>>
      : TKey extends 'like' | 'ilike'
        ? TSearchValue<Extract<TValue, string>>
        : TKey extends 'gt' | 'gte' | 'lt' | 'lte'
          ? TSearchValue<Exclude<TValue, boolean>>
          : TSearchValue<TValue>;
};

export type TSearchCondition<TValue extends TBaseValue = TBaseValue> = [
  TValue,
] extends [never]
  ? never
  : OnlyOneKey<TConditionMap<TValue>>;

export type TSearch<TTShape> = {
  readonly [TKey in TPath<TTShape>]?:
    | TSearchCondition<TSearchableValue<TPathValue<TTShape, TKey>>>
    | TSearchValue<TSearchableValue<TPathValue<TTShape, TKey>>>;
};

export interface TSearchOptions {
  readonly defaultCondition?: TCondition;
  readonly includeSearchFields?: boolean;
  readonly logger?: TLogger;
  readonly strict?: boolean;
}

export interface TSearchResult {
  [QUERY_NAMES.SRC]: string | undefined;
  [QUERY_NAMES.SFI]: string | undefined;
}

type TParsedSearchEntry = readonly [
  key: string,
  value: string,
  condition: TCondition,
];

interface SearchParseContext {
  readonly defaultCondition: TCondition;
  readonly issues: TValidationIssue[];
  readonly log?: TLogger;
  readonly strict: boolean;
}

const EMPTY_RESULT: TSearchResult = {
  [QUERY_NAMES.SRC]: undefined,
  [QUERY_NAMES.SFI]: undefined,
};
const CONDITION_VALUES: readonly unknown[] = Object.values(CONDITIONS);
const SINGLE_CONDITION_COUNT = 1;
const TUPLE_SIZE = 2;
const ALL_DELIMITER_RE = /[;:,]/v;
const SCALAR_DELIMITER_RE = /[;:]/v;
const DELIMITERS_ALL = ';, :, or ,';
const DELIMITERS_PAIR = '; or :';

interface DelimiterCheck {
  readonly allowComma?: boolean;
  readonly field: string;
  readonly target: 'key' | 'value';
  readonly text: string;
  readonly value: unknown;
}

function hasValidDelimiters(
  check: DelimiterCheck,
  context: {
    readonly issues: TValidationIssue[];
    readonly log?: TLogger;
    readonly strict: boolean;
  },
): boolean {
  const pattern = check.allowComma ? SCALAR_DELIMITER_RE : ALL_DELIMITER_RE;
  if (!pattern.test(check.text)) {
    return true;
  }

  const delimiters = check.allowComma ? DELIMITERS_PAIR : DELIMITERS_ALL;
  recordSearchIssue(context, {
    field: check.field,
    message: msgReservedDelimiter(QUERY_LABELS.SRC, check.target, delimiters),
    value: check.value,
  });
  return false;
}

function formatBaseValue(value: TBaseValue): string {
  return typeof value === 'string' ? value.trim() : String(value);
}

function isConditionValue(value: unknown): value is TCondition {
  return CONDITION_VALUES.includes(value);
}

function recordSearchIssue(
  context: {
    readonly issues: TValidationIssue[];
    readonly log?: TLogger;
    readonly strict: boolean;
  },
  issue: TValidationIssue,
  level: 'info' | 'warn' = 'warn',
): void {
  if (context.strict) {
    context.log?.error(issue.message);
    context.issues.push(issue);
  } else {
    context.log?.[level](issue.message);
  }
}

function buildSearchResult(
  entries: readonly TParsedSearchEntry[],
  includeSearchFields?: boolean,
): TSearchResult {
  if (!entries.length) {
    return { ...EMPTY_RESULT };
  }

  const searchParts: string[] = [];
  const fieldParts: string[] = [];

  for (const [key, val, condition] of entries) {
    searchParts.push(`${key}:${val}`);
    if (includeSearchFields === true) {
      fieldParts.push(`${key}:${condition}`);
    }
  }

  return {
    [QUERY_NAMES.SRC]: searchParts.join(';'),
    [QUERY_NAMES.SFI]: fieldParts.length ? fieldParts.join(';') : undefined,
  };
}

/**
 * Formats object-based search criteria into `search` and optional `searchFields` parameter strings.
 *
 * @remarks
 * Under strict mode (default), top-level non-object inputs and invalid entries/options produce a `ParamsL5ValidationError`.
 * `null` and `undefined` entry values are safely skipped.
 * Set `options.strict` to `false` to drop invalid entries and fall back to defaults without throwing.
 *
 * @example
 * ```typescript
 * Search.build(
 *   { name: { like: 'John' }, age: { gte: 18 } },
 *   { includeSearchFields: true },
 * );
 * // => { search: "name:John;age:18", searchFields: "name:like;age:>=" }
 * ```
 */
export class Search {
  static safe<TShape extends object = Record<string, unknown>>(
    value?: TSearch<TShape> | null,
    options?: TSearchOptions,
  ): TResult<TSearchResult> {
    const log = options?.logger;
    const strict = options?.strict ?? true;

    if (value === undefined || value === null) {
      log?.info(msgNoValue(QUERY_LABELS.SRC));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    if (!isObject(value)) {
      const message = msgMustBeObject(QUERY_LABELS.SRC, typeName(value));
      log?.error(message);
      if (!strict) {
        return { data: { ...EMPTY_RESULT }, success: true };
      }
      return {
        error: ParamsL5ValidationError.fromField(
          QUERY_NAMES.SRC,
          message,
          value,
        ),
        success: false,
      };
    }

    const entries = Object.entries(value);
    if (!entries.length) {
      log?.info(msgNoValues(QUERY_LABELS.SRC));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    const issues: TValidationIssue[] = [];
    const defaultCondition = Search.#resolveDefaultCondition(
      options?.defaultCondition,
      { issues, log, strict },
    );

    const parsedEntries: TParsedSearchEntry[] = [];
    for (const [index, entry] of entries.entries()) {
      const parsed = Search.#parseEntry(entry, index, {
        defaultCondition,
        issues,
        log,
        strict,
      });
      if (parsed) {
        parsedEntries.push(parsed);
      }
    }

    if (issues.length) {
      return {
        error: ParamsL5ValidationError.fromIssues(issues),
        success: false,
      };
    }

    if (!parsedEntries.length) {
      log?.info(msgNoRemaining(QUERY_LABELS.SRC));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    return {
      data: buildSearchResult(parsedEntries, options?.includeSearchFields),
      success: true,
    };
  }

  static build<TShape extends object = Record<string, unknown>>(
    value?: TSearch<TShape> | null,
    options?: TSearchOptions,
  ): TSearchResult {
    return unwrap(Search.safe(value, options));
  }

  static #resolveDefaultCondition(
    defaultCondition: TCondition | undefined,
    context: {
      readonly issues: TValidationIssue[];
      readonly log?: TLogger;
      readonly strict: boolean;
    },
  ): TCondition {
    if (defaultCondition === undefined) {
      return CONDITIONS.EQ;
    }
    if (!isConditionValue(defaultCondition)) {
      recordSearchIssue(context, {
        field: `${QUERY_NAMES.SRC}.defaultCondition`,
        message: msgInvalidCondition(QUERY_LABELS.SRC, defaultCondition),
        value: defaultCondition,
      });
      return CONDITIONS.EQ;
    }
    return defaultCondition;
  }

  static #parseEntry(
    [key, rawValue]: readonly [string, unknown],
    index: number,
    context: SearchParseContext,
  ): TParsedSearchEntry | undefined {
    if (!isNonEmptyString(key)) {
      recordSearchIssue(context, {
        field: `${QUERY_NAMES.SRC}[${index}]`,
        message: msgInvalidKey(QUERY_LABELS.SRC, typeName(key), index),
        value: key,
      });
      return undefined;
    }

    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    const trimmedKey = key.trim();
    if (
      !hasValidDelimiters(
        {
          field: `${QUERY_NAMES.SRC}[${index}]`,
          target: 'key',
          text: trimmedKey,
          value: key,
        },
        context,
      )
    ) {
      return undefined;
    }

    if (isBaseValue(rawValue)) {
      const formatted = formatBaseValue(rawValue);
      const allowComma =
        context.defaultCondition !== CONDITIONS.IN &&
        context.defaultCondition !== CONDITIONS.BTW;
      if (
        !hasValidDelimiters(
          {
            allowComma,
            field: `${QUERY_NAMES.SRC}.${trimmedKey}`,
            target: 'value',
            text: formatted,
            value: rawValue,
          },
          context,
        )
      ) {
        return undefined;
      }
      return [trimmedKey, formatted, context.defaultCondition];
    }

    if (isObject(rawValue)) {
      return Search.#parseConditionObject(trimmedKey, rawValue, index, context);
    }

    if (isArray(rawValue)) {
      recordSearchIssue(context, {
        field: `${QUERY_NAMES.SRC}.${trimmedKey}`,
        message: msgMissingConditionArray(QUERY_LABELS.SRC),
        value: rawValue,
      });
      return undefined;
    }

    recordSearchIssue(
      context,
      {
        field: `${QUERY_NAMES.SRC}.${trimmedKey}`,
        message: msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(rawValue)),
        value: rawValue,
      },
      'info',
    );
    return undefined;
  }

  static #parseConditionObject(
    key: string,
    rawCondition: object,
    index: number,
    context: SearchParseContext,
  ): TParsedSearchEntry | undefined {
    const field = `${QUERY_NAMES.SRC}.${key}`;
    const conditionEntries: readonly [string, unknown][] =
      Object.entries(rawCondition);

    if (conditionEntries.length !== SINGLE_CONDITION_COUNT) {
      recordSearchIssue(context, {
        field,
        message: msgInvalidCondition(QUERY_LABELS.SRC, typeName(rawCondition)),
        value: rawCondition,
      });
      return undefined;
    }

    const [firstEntry] = conditionEntries;
    if (!firstEntry) {
      return undefined;
    }

    const [rawKey, rawVal] = firstEntry;
    const upperKey = isNonEmptyString(rawKey)
      ? rawKey.trim().toUpperCase()
      : '';

    if (!isConditionKey(upperKey)) {
      recordSearchIssue(context, {
        field,
        message: msgInvalidCondition(QUERY_LABELS.SRC, rawKey),
        value: rawCondition,
      });
      return undefined;
    }

    if (rawVal === null || rawVal === undefined) {
      return undefined;
    }

    const condition = CONDITIONS[upperKey];

    if (condition === CONDITIONS.IN) {
      return Search.#parseInCondition(key, field, rawVal, context);
    }

    if (condition === CONDITIONS.BTW) {
      return Search.#parseBtwCondition(key, field, rawVal, index, context);
    }

    if (isArray(rawVal)) {
      recordSearchIssue(context, {
        field,
        message: msgInvalidConditionArray(QUERY_LABELS.SRC, index),
        value: rawVal,
      });
      return undefined;
    }

    if (!isBaseValue(rawVal)) {
      recordSearchIssue(
        context,
        {
          field,
          message: msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(rawVal)),
          value: rawVal,
        },
        'info',
      );
      return undefined;
    }

    const formatted = formatBaseValue(rawVal);
    if (
      !hasValidDelimiters(
        {
          allowComma: true,
          field,
          target: 'value',
          text: formatted,
          value: rawVal,
        },
        context,
      )
    ) {
      return undefined;
    }

    return [key, formatted, condition];
  }

  static #parseInCondition(
    key: string,
    field: string,
    rawVal: unknown,
    context: SearchParseContext,
  ): TParsedSearchEntry | undefined {
    if (!isArray(rawVal)) {
      recordSearchIssue(context, {
        field,
        message: msgItemNotArray(QUERY_LABELS.SRC, typeName(rawVal)),
        value: rawVal,
      });
      return undefined;
    }

    const validItems: string[] = [];
    for (const item of rawVal) {
      if (item !== null && item !== undefined) {
        if (isBaseValue(item)) {
          const formatted = formatBaseValue(item);
          if (
            hasValidDelimiters(
              {
                field,
                target: 'value',
                text: formatted,
                value: rawVal,
              },
              context,
            )
          ) {
            validItems.push(formatted);
          } else if (context.strict) {
            return undefined;
          }
        } else if (context.strict) {
          recordSearchIssue(context, {
            field,
            message: msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(item)),
            value: rawVal,
          });
          return undefined;
        }
      }
    }

    if (!validItems.length) {
      if (context.strict) {
        recordSearchIssue(context, {
          field,
          message: msgNoValues(QUERY_LABELS.SRC),
          value: rawVal,
        });
      }
      return undefined;
    }

    return [key, validItems.join(','), CONDITIONS.IN];
  }

  static #parseBtwCondition(
    key: string,
    field: string,
    rawVal: unknown,
    index: number,
    context: SearchParseContext,
  ): TParsedSearchEntry | undefined {
    if (!isArray(rawVal)) {
      recordSearchIssue(context, {
        field,
        message: msgItemNotArray(QUERY_LABELS.SRC, typeName(rawVal)),
        value: rawVal,
      });
      return undefined;
    }

    if (rawVal.length !== TUPLE_SIZE) {
      recordSearchIssue(context, {
        field,
        message: msgInvalidBetweenSize(QUERY_LABELS.SRC, rawVal.length, index),
        value: rawVal,
      });
      return undefined;
    }

    if (!rawVal.every((item): item is TBaseValue => isBaseValue(item))) {
      recordSearchIssue(
        context,
        {
          field,
          message: msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(rawVal)),
          value: rawVal,
        },
        'info',
      );
      return undefined;
    }

    const formattedItems = rawVal.map((item) => formatBaseValue(item));
    for (const formatted of formattedItems) {
      if (
        !hasValidDelimiters(
          {
            field,
            target: 'value',
            text: formatted,
            value: rawVal,
          },
          context,
        )
      ) {
        return undefined;
      }
    }

    return [key, formattedItems.join(','), CONDITIONS.BTW];
  }
}

Search satisfies TGenerator<
  TSearch<Record<string, unknown>> | null | undefined,
  TSearchOptions,
  TSearchResult
>;
