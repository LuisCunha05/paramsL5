import { CONDITIONS, QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
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
 * Top-level non-object inputs (excluding `null` and `undefined`) produce a validation error.
 * Individual field entries with `null`, `undefined`, or invalid shapes/conditions are safely filtered out.
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
    if (value === undefined || value === null) {
      log?.info(msgNoValue(QUERY_LABELS.SRC));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    if (!isObject(value)) {
      const message = msgMustBeObject(QUERY_LABELS.SRC, typeName(value));
      log?.error(message);
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

    const defaultCondition = Search.#resolveDefaultCondition(
      options?.defaultCondition,
      log,
    );

    const parsedEntries: TParsedSearchEntry[] = [];
    for (const [index, entry] of entries.entries()) {
      const parsed = Search.#parseEntry(entry, index, {
        defaultCondition,
        log,
      });
      if (parsed) {
        parsedEntries.push(parsed);
      }
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
    defaultCondition?: TCondition,
    log?: TLogger,
  ): TCondition {
    if (defaultCondition === undefined) {
      return CONDITIONS.EQ;
    }
    if (!isConditionValue(defaultCondition)) {
      log?.warn(msgInvalidCondition(QUERY_LABELS.SRC, defaultCondition));
      return CONDITIONS.EQ;
    }
    return defaultCondition;
  }

  static #parseEntry(
    [key, rawValue]: readonly [string, unknown],
    index: number,
    context: { readonly defaultCondition: TCondition; readonly log?: TLogger },
  ): TParsedSearchEntry | undefined {
    const { defaultCondition, log } = context;
    if (!isNonEmptyString(key)) {
      log?.warn(msgInvalidKey(QUERY_LABELS.SRC, typeName(key), index));
      return undefined;
    }

    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    const trimmedKey = key.trim();

    if (isBaseValue(rawValue)) {
      return [trimmedKey, formatBaseValue(rawValue), defaultCondition];
    }

    if (isObject(rawValue)) {
      return Search.#parseConditionObject(trimmedKey, rawValue, { index, log });
    }

    if (isArray(rawValue)) {
      log?.warn(msgMissingConditionArray(QUERY_LABELS.SRC));
    } else {
      log?.info(msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(rawValue)));
    }
    return undefined;
  }

  static #parseConditionObject(
    key: string,
    rawCondition: object,
    context: { readonly index: number; readonly log?: TLogger },
  ): TParsedSearchEntry | undefined {
    const { index, log } = context;
    const conditionEntries: readonly [string, unknown][] =
      Object.entries(rawCondition);
    if (conditionEntries.length !== SINGLE_CONDITION_COUNT) {
      log?.warn(msgInvalidCondition(QUERY_LABELS.SRC, typeName(rawCondition)));
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
      log?.warn(msgInvalidCondition(QUERY_LABELS.SRC, rawKey));
      return undefined;
    }

    if (rawVal === null || rawVal === undefined) {
      return undefined;
    }

    const condition = CONDITIONS[upperKey];

    if (condition === CONDITIONS.IN) {
      if (!isArray(rawVal)) {
        log?.warn(msgItemNotArray(QUERY_LABELS.SRC, typeName(rawVal)));
        return undefined;
      }
      const validItems = rawVal.filter((item): item is TBaseValue =>
        isBaseValue(item),
      );
      if (!validItems.length) {
        return undefined;
      }
      return [
        key,
        validItems.map((item) => formatBaseValue(item)).join(','),
        condition,
      ];
    }

    if (condition === CONDITIONS.BTW) {
      if (!isArray(rawVal)) {
        log?.warn(msgItemNotArray(QUERY_LABELS.SRC, typeName(rawVal)));
        return undefined;
      }
      if (rawVal.length !== TUPLE_SIZE) {
        log?.warn(
          msgInvalidBetweenSize(QUERY_LABELS.SRC, rawVal.length, index),
        );
        return undefined;
      }
      if (!rawVal.every((item): item is TBaseValue => isBaseValue(item))) {
        log?.info(msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(rawVal)));
        return undefined;
      }
      return [
        key,
        rawVal.map((item) => formatBaseValue(item)).join(','),
        condition,
      ];
    }

    if (isArray(rawVal)) {
      log?.warn(msgInvalidConditionArray(QUERY_LABELS.SRC, index));
      return undefined;
    }

    if (!isBaseValue(rawVal)) {
      log?.info(msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(rawVal)));
      return undefined;
    }

    return [key, formatBaseValue(rawVal), condition];
  }
}

Search satisfies TGenerator<
  TSearch<Record<string, unknown>> | null | undefined,
  TSearchOptions,
  TSearchResult
>;
