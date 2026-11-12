import { QUERY_LABELS, QUERY_NAMES, SORT_BY } from '#/constants';
import { defaultLogger } from '#/logger';
import {
  msgInvalidKey,
  msgInvalidSortBy,
  msgItemNotArray,
  msgItemNotKeyValue,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TLogger, TPath, ToEnum } from '#/types';
import { isArray, isNonEmptyString, typeName } from '#/utils';

export type TSortBy = ToEnum<typeof SORT_BY>;

export type TOrderBySortByValue<TTShape> = readonly [
  NoInfer<TPath<TTShape>>,
  TSortBy?,
];
export type TOrderBySortByDefault<TTShape> = readonly [NoInfer<TPath<TTShape>>];
export type TOrderBySortByArguments<TTShape> =
  | TOrderBySortByValue<TTShape>
  | TOrderBySortByDefault<TTShape>;

interface TOrderBySortByOptions {
  defaultSortBy?: TSortBy;
  logger?: TLogger;
}

export type TOrderBySortBy<TTShape> =
  readonly TOrderBySortByArguments<TTShape>[];

export interface TOrderBySortByResult {
  [QUERY_NAMES.OBY]: string | undefined;
  [QUERY_NAMES.SBY]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.OBY]: undefined,
  [QUERY_NAMES.SBY]: undefined,
} as const;

const MIN_TUPLE_SIZE = 1;
const MAX_TUPLE_SIZE = 2;

/**
 * Formats sorting columns and directions into paired `orderBy` and `sortedBy` parameters.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as malformed tuples or invalid sort directions) are filtered out safely.
 *
 * @param arg - Array of tuples in `[field, 'asc' | 'desc']` format.
 * @param options - Optional settings such as `defaultSortBy` and custom logger.
 * @returns An object `{ orderBy, sortedBy }` with semicolon-separated values, or `undefined` values if no valid entries remain.
 *
 * @example
 * ```typescript
 * orderBySortBy([['created_at', 'desc'], ['name', 'asc']]);
 * // => { orderBy: "created_at;name", sortedBy: "desc;asc" }
 * ```
 */
export function orderBySortBy<TShape extends object = Record<string, unknown>>(
  arg: TOrderBySortBy<TShape> = [],
  options: TOrderBySortByOptions = {},
): TOrderBySortByResult {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.OBY, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.OBY));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.reduce((result, item, index) => {
    if (!isArray(item)) {
      log?.warn(msgItemNotArray(QUERY_LABELS.OBY, typeName(item)));
      return result;
    }

    if (item.length < MIN_TUPLE_SIZE || item.length > MAX_TUPLE_SIZE) {
      log?.warn(msgItemNotKeyValue(QUERY_LABELS.OBY, item.length, index));
      return result;
    }

    const [key, sortBy] = item;

    if (!isNonEmptyString(key)) {
      log?.warn(msgInvalidKey(QUERY_LABELS.OBY, typeName(key), index));
      return result;
    }

    if (sortBy !== undefined && !Object.values(SORT_BY).includes(sortBy)) {
      log?.warn(msgInvalidSortBy(QUERY_LABELS.OBY, sortBy, index));
      return result;
    }

    result.set(key, sortBy ?? options?.defaultSortBy ?? SORT_BY.ASC);

    return result;
  }, new Map<TPath<TShape>, TSortBy>());

  if (!filteredValues.size) {
    log?.info(msgNoRemaining(QUERY_LABELS.OBY));
    return EMPTY_RESULT;
  }

  const deduplicatedValues = [...filteredValues];

  const orderBySortedBy = deduplicatedValues.reduce(
    (result, [key, value]) => {
      result.orderBy.push(key);
      result.sortedBy.push(value);
      return result;
    },
    { orderBy: [] as TPath<TShape>[], sortedBy: [] as TSortBy[] },
  );

  const orderResult = orderBySortedBy.orderBy.join(';');
  const sortedResult = orderBySortedBy.sortedBy.join(';');

  return {
    [QUERY_NAMES.OBY]: orderResult,
    [QUERY_NAMES.SBY]: sortedResult,
  };
}
