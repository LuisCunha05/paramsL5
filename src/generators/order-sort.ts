import { SORT_BY } from '@/constants';
import type { ILogger, Path } from '@/types';
import { isArray, isNonEmptyString, typeName } from '@/utils';

export type TSortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export type TOrderBySortByValue<TTShape> = readonly [
  NoInfer<Path<TTShape>>,
  TSortBy?,
];
export type TOrderBySortByDefault<TTShape> = readonly [NoInfer<Path<TTShape>>];
export type TOrderBySortByArguments<TTShape> =
  | TOrderBySortByValue<TTShape>
  | TOrderBySortByDefault<TTShape>;

interface TOrderBySortByOptions {
  defaultSortBy?: TSortBy;
  logger?: ILogger;
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
  const log = options.logger ?? console;
  if (!isArray(arg)) {
    log?.error(
      `OrderBySortBy: keys must have a type of array, got ${typeName(arg)} instead`,
    );
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info('OrderBySortBy: no values given');
    return EMPTY_RESULT;
  }

  const filteredValues = arg.reduce((result, item, index) => {
    if (!isArray(item)) {
      log?.warn(
        `OrderBySortBy: must have a type of array, got ${typeName(item)} instead`,
      );
      return result;
    }

    if (item.length < MIN_TUPLE_SIZE || item.length > MAX_TUPLE_SIZE) {
      log?.warn(
        `OrderBySortBy: must have a key-value array, but got length ${item.length} at index ${index} instead`,
      );
      return result;
    }

    const [key, sortBy] = item;

    if (!isNonEmptyString(key)) {
      log?.warn(
        `OrderBySortBy: must have keys as non-empty strings, but got ${typeName(key)} at index ${index} instead`,
      );
      return result;
    }

    if (sortBy !== undefined && !Object.values(SORT_BY).includes(sortBy)) {
      log?.warn(
        `OrderBySortBy: must have a valid SORT_BY value, but got ${sortBy} at index ${index} instead`,
      );
      return result;
    }

    result.set(key, sortBy ?? options?.defaultSortBy ?? SORT_BY.ASC);

    return result;
  }, new Map<Path<TShape>, TSortBy>());

  if (!filteredValues.size) {
    log?.info('OrderBySortBy: no values remaining to parse');
    return EMPTY_RESULT;
  }

  const deduplicatedValues = [...filteredValues];

  const orderBySortedBy = deduplicatedValues.reduce(
    (result, [key, value]) => {
      result.orderBy.push(key);
      result.sortedBy.push(value);
      return result;
    },
    { orderBy: [] as Path<TShape>[], sortedBy: [] as TSortBy[] },
  );

  const orderResult = orderBySortedBy.orderBy.join(';');
  const sortedResult = orderBySortedBy.sortedBy.join(';');

  return {
    orderBy: orderResult,
    sortedBy: sortedResult,
  };
}
