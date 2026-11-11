import { QUERY_LABELS, SORT_BY } from '#s/constants';
import { defaultLogger } from '#s/logger';
import {
  msgInvalidKey,
  msgInvalidSortBy,
  msgItemNotArray,
  msgItemNotKeyValue,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#s/messages';
import type { TLogger, TPath, ToEnum } from '#s/types';
import { isArray, isNonEmptyString, typeName } from '#s/utils';

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

interface TOrderBySortByResult {
  orderBy: string | undefined;
  sortedBy: string | undefined;
}

const EMPTY_RESULT = {
  orderBy: undefined,
  sortedBy: undefined,
} as const;

const MIN_TUPLE_SIZE = 1;
const MAX_TUPLE_SIZE = 2;

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
    orderBy: orderResult,
    sortedBy: sortedResult,
  };
}
