import { CONDITIONS, QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { defaultLogger } from '#/logger';
import {
  msgInvalidBaseValue,
  msgInvalidBetweenSize,
  msgInvalidCondition,
  msgInvalidConditionArray,
  msgInvalidKey,
  msgItemNotArray,
  msgItemNotKeyValue,
  msgMissingConditionArray,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TBaseValue, TLogger, TPath, ToEnum } from '#/types';
import { isArray, isBaseValue, isNonEmptyString, typeName } from '#/utils';

export type TCondition = ToEnum<typeof CONDITIONS>;

export type TSearchValue = TBaseValue | null | undefined;
type BetweenTuple<TValue> = [TValue, TValue];

export type TSearchIn<TTShape> = readonly [
  NoInfer<TPath<TTShape>>,
  (string | number | null | undefined)[] | null | undefined,
  Extract<TCondition, 'in'>,
];

export type TSearchBetween<TTShape> = readonly [
  NoInfer<TPath<TTShape>>,
  (
    | BetweenTuple<string | null | undefined>
    | BetweenTuple<number | null | undefined>
    | null
    | undefined
  ),
  Extract<TCondition, 'between'>,
];

export type TSearchEqual<TTShape> = readonly [
  NoInfer<TPath<TTShape>>,
  TSearchValue,
];

export type TSearchRegular<TTShape> = readonly [
  NoInfer<TPath<TTShape>>,
  TSearchValue,
  Exclude<TCondition, 'in' | 'between'> | undefined,
];

export type TSearchItem<TTShape> =
  | TSearchRegular<TTShape>
  | TSearchIn<TTShape>
  | TSearchBetween<TTShape>
  | TSearchEqual<TTShape>;

export type TSearch<TTShape> = readonly TSearchItem<TTShape>[];

export interface TSearchOptions {
  defaultCondition?: TCondition;
  includeSearchFields?: boolean;
  logger?: TLogger;
}

export interface TSearchResult {
  [QUERY_NAMES.SRC]: string | undefined;
  [QUERY_NAMES.SFI]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.SRC]: undefined,
  [QUERY_NAMES.SFI]: undefined,
} as const;
const TUPLE_SIZE = 2;

/**
 * Formats search criteria into `search` and optional `searchFields` parameter strings.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as malformed tuples, non-array inputs, or invalid conditions) are filtered out safely.
 *
 * @param arg - Array of search tuples in `[field, value, condition?]` format.
 * @param options - Search options including `includeSearchFields` and `defaultCondition`.
 * @returns An object containing `{ search, searchFields }`, or `undefined` values if no valid entries remain.
 *
 * @example
 * ```typescript
 * search([
 *   ['name', 'John', CONDITIONS.LIKE],
 *   ['age', 18, CONDITIONS.GTE],
 * ], { includeSearchFields: true });
 * // => { search: "name:John;age:18", searchFields: "name:like;age:>=" }
 * ```
 */
export function search<TShape extends object = Record<string, unknown>>(
  arg: TSearch<TShape> = [],
  options: TSearchOptions = {},
): TSearchResult {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.SRC, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.SRC));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.reduce<
    [TPath<TShape>, [TBaseValue, TCondition]][]
  >((result, item, index) => {
    if (!isArray(item)) {
      log?.warn(msgItemNotArray(QUERY_LABELS.SRC, typeName(item)));
      return result;
    }

    if (item.length < TUPLE_SIZE) {
      log?.warn(msgItemNotKeyValue(QUERY_LABELS.SRC, item.length, index));
      return result;
    }

    const [key, value, condition] = item;
    if (!isNonEmptyString(key)) {
      log?.warn(msgInvalidKey(QUERY_LABELS.SRC, typeName(key), index));
      return result;
    }

    if (value === null || value === undefined) {
      return result;
    }

    let finalValue: TBaseValue;

    if (isArray(value)) {
      if (!value.length) {
        return result;
      }
      if (!condition) {
        log?.warn(msgMissingConditionArray(QUERY_LABELS.SRC));
        return result;
      }

      if (condition !== CONDITIONS.BTW && condition !== CONDITIONS.IN) {
        log?.warn(msgInvalidConditionArray(QUERY_LABELS.SRC, index));
        return result;
      }

      if (condition === CONDITIONS.BTW && value.length !== TUPLE_SIZE) {
        log?.warn(
          msgInvalidBetweenSize(
            QUERY_LABELS.SRC,
            (value as unknown[]).length,
            index,
          ),
        );
        return result;
      }
      if (!value.every((val) => isBaseValue(val))) {
        return result;
      }

      finalValue = value.join(',');
    } else {
      if (!isBaseValue(value)) {
        log?.info(msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(value)));
        return result;
      }
      finalValue = value;
    }

    if (
      condition !== undefined &&
      !Object.values(CONDITIONS).includes(condition)
    ) {
      log?.warn(msgInvalidCondition(QUERY_LABELS.SRC, value));
      return result;
    }

    result.push([
      key,
      [finalValue, condition ?? options.defaultCondition ?? CONDITIONS.EQ],
    ]);

    return result;
  }, []);

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.SRC));
    return EMPTY_RESULT;
  }

  const deduplicatedValues = [...new Map(filteredValues)];

  const searchAndFields = deduplicatedValues.reduce(
    (result, [key, [value, condition]]) => {
      const newValue = typeof value === 'string' ? value.trim() : value;

      result.search.push(`${key}:${newValue}`);
      if (options.includeSearchFields === true) {
        result.fields.push(`${key}:${condition}`);
      }

      return result;
    },
    { fields: [] as string[], search: [] as string[] },
  );

  if (!searchAndFields.search.length) {
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.SRC]: searchAndFields.search.join(';'),
    [QUERY_NAMES.SFI]: searchAndFields.fields.length
      ? searchAndFields.fields.join(';')
      : undefined,
  };
}
