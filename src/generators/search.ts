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
} from '#/messages';
import type {
  OnlyOneKey,
  TBaseValue,
  TConditionKeys,
  TGenerator,
  TLogger,
  TPath,
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
export type TSearchValue = TBaseValue | null | undefined;
type BetweenTuple<TValue> = readonly [TValue, TValue];

type TSearchBetweenValue =
  | BetweenTuple<string | null | undefined>
  | BetweenTuple<number | null | undefined>
  | null
  | undefined;

type TSearchInValue =
  | readonly (string | number | null | undefined)[]
  | null
  | undefined;

type TConditionMap = {
  [TKey in Lowercase<TConditionKeys>]: TKey extends 'btw'
    ? TSearchBetweenValue
    : TKey extends 'in'
      ? TSearchInValue
      : TSearchValue;
};

export type TSearchCondition = OnlyOneKey<TConditionMap>;
export type TSearch<TTShape> = Readonly<
  Partial<Record<TPath<TTShape>, TSearchCondition | TSearchValue>>
>;

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

    if (isBaseValue(rawValue)) {
      return [trimmedKey, formatBaseValue(rawValue), context.defaultCondition];
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

    return [key, formatBaseValue(rawVal), condition];
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

    const validItems: TBaseValue[] = [];
    for (const item of rawVal) {
      if (item !== null && item !== undefined) {
        if (isBaseValue(item)) {
          validItems.push(item);
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

    return [
      key,
      validItems.map((item) => formatBaseValue(item)).join(','),
      CONDITIONS.IN,
    ];
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

    return [
      key,
      rawVal.map((item) => formatBaseValue(item)).join(','),
      CONDITIONS.BTW,
    ];
  }
}

Search satisfies TGenerator<
  TSearch<Record<string, unknown>> | null | undefined,
  TSearchOptions,
  TSearchResult
>;
