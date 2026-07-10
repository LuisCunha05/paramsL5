import { SORT_BY } from '@/constants';
import type { ILogger, TResult } from '@/types';
import { encodeSearchParam, isNonEmptyString, typeName } from '@/utils';

export type TSortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export type TOrderBySortByValue = readonly [string, TSortBy?];
export type TOrderBySortByDefault = readonly [string];
export type TOrderBySortByArguments =
  | TOrderBySortByValue
  | TOrderBySortByDefault;

type TOrderBySortByOptions = { defaultSortBy?: TSortBy; logger?: ILogger };

export type TOrderBySortBy = readonly TOrderBySortByArguments[];

type TOrderBySortByResult = {
  orderBy: TResult | undefined;
  sortedBy: TResult | undefined;
};

const EMPTY_RESULT = {
  orderBy: undefined,
  sortedBy: undefined,
} as const;

export function orderBySortBy(
  arg: TOrderBySortBy = [],
  options: TOrderBySortByOptions = {},
): TOrderBySortByResult {
  const log = options.logger ?? console;
  if (!Array.isArray(arg as TOrderBySortBy)) {
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
    if (!Array.isArray(item as TOrderBySortByArguments)) {
      log?.warn(
        `OrderBySortBy: must have a type of array, got ${typeName(item)} instead`,
      );
      return result;
    }

    if (item.length < 1 || item.length > 2) {
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

    if (
      typeof sortBy !== 'undefined' &&
      !Object.values(SORT_BY).includes(sortBy)
    ) {
      log?.warn(
        `OrderBySortBy: must have a valid SORT_BY value, but got ${sortBy} at index ${index} instead`,
      );
      return result;
    }

    result.set(key, sortBy ?? options?.defaultSortBy ?? SORT_BY.ASC);

    return result;
  }, new Map<string, TSortBy>());

  if (!filteredValues.size) {
    log?.info('OrderBySortBy: no values remaining to parse');
    return EMPTY_RESULT;
  }

  const deduplicatedValues = Array.from(filteredValues);

  const orderBySortedBy = deduplicatedValues.reduce(
    (result, [key, value]) => {
      result.orderBy.push(key);
      result.sortedBy.push(value);
      return result;
    },
    { orderBy: [] as string[], sortedBy: [] as TSortBy[] },
  );

  const params = new URLSearchParams();
  params.set('orderBy', orderBySortedBy.orderBy.join(';'));
  params.set('sortedBy', orderBySortedBy.sortedBy.join(';'));

  const orderResult = orderBySortedBy.orderBy.join(';');
  const sortedResult = orderBySortedBy.sortedBy.join(';');

  return {
    orderBy: { raw: orderResult, encoded: encodeSearchParam(orderResult) },
    sortedBy: { raw: sortedResult, encoded: encodeSearchParam(sortedResult) },
  };
}
