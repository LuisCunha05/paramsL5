import type { TParams, TResultParams } from '@/params-l5';

import { filter } from './generators/filter';
import { include } from './generators/include';
import { type TLimit, limit } from './generators/limit';
import { type TSortBy, orderBySortBy } from './generators/order-sort';
import { type TPage, page } from './generators/page';
import { type TCondition, search } from './generators/search';
import { searchCriteria } from './generators/search-criteria';
import { type TSearchJoin, searchJoin } from './generators/search-join';
import { withRel } from './generators/with';
import type {
  ILogger,
  ValidateFlatArray,
  ValidateKeyTupleArray,
} from './types';

interface DefaultOptions {
  sortBy?: TSortBy;
  page?: TPage;
  limit?: TLimit;
  searchJoin?: TSearchJoin;
  searchCondition?: TCondition;
}

export interface ClientOptions {
  defaultOptions?: DefaultOptions;
  logger?: ILogger;
}

export type ValidateParams<TInput> = {
  [KFn in keyof TInput]: KFn extends 'include' | 'with' | 'filter'
    ? ValidateFlatArray<TInput[KFn]>
    : KFn extends 'orderBySortBy' | 'search' | 'searchCriteria'
      ? ValidateKeyTupleArray<TInput[KFn]>
      : TInput[KFn];
};

export interface ClientRunner {
  <TShape extends object = Record<string, unknown>>(
    params?: TParams<TShape>,
  ): TResultParams;

  for: <TShape extends object>() => <const TInput extends TParams<TShape>>(
    params?: ValidateParams<TInput> extends TInput
      ? TInput
      : ValidateParams<TInput>,
  ) => TResultParams;
}

export function createClient(options: ClientOptions = {}): ClientRunner {
  function runner<TShape extends object = Record<string, unknown>>(
    params: TParams<TShape> = {},
  ): TResultParams {
    const { logger } = options;
    const searchObj = search(params.search, {
      defaultCondition: options?.defaultOptions?.searchCondition,
      logger,
    });

    const orderBySortByObj = orderBySortBy(params.orderBySortBy, {
      defaultSortBy: options?.defaultOptions?.sortBy,
      logger,
    });

    function toParams() {
      const queryParams = new URLSearchParams();

      if (result.filter) {
        queryParams.append('filter', result.filter);
      }
      if (result.include) {
        queryParams.append('include', result.include);
      }
      if (result.limit) {
        queryParams.append('limit', result.limit);
      }
      if (result.orderBy) {
        queryParams.append('orderBy', result.orderBy);
      }
      if (result.sortBy) {
        queryParams.append('sortedBy', result.sortBy);
      }
      if (result.page) {
        queryParams.append('page', result.page);
      }
      if (result.search) {
        queryParams.append('search', result.search);
      }
      if (result.searchFields) {
        queryParams.append('searchFields', result.searchFields);
      }
      if (result.searchCriteria) {
        queryParams.append('searchCriteria', result.searchCriteria);
      }
      if (result.with) {
        queryParams.append('with', result.with);
      }
      if (result.searchJoin) {
        queryParams.append('searchJoin', result.searchJoin);
      }
      return queryParams.toString();
    }

    const result: TResultParams = {
      filter: filter(params.filter, { logger }),
      include: include(params.include, { logger }),
      limit: limit(params.limit ?? options?.defaultOptions?.limit, { logger }),
      orderBy: orderBySortByObj.orderBy,
      page: page(params.page ?? options?.defaultOptions?.page, { logger }),
      search: searchObj?.search,
      searchCriteria: searchCriteria(params.searchCriteria, { logger }),
      searchFields: searchObj?.searchFields,
      searchJoin: searchJoin(
        params.searchJoin ?? options?.defaultOptions?.searchJoin,
        { logger },
      ),
      sortBy: orderBySortByObj.sortedBy,
      toParams,
      with: withRel(params.with, { logger }),
    };

    return result;
  }

  runner.for =
    <TShape extends object>() =>
    (params: TParams<TShape> = {}) =>
      runner(params);

  return runner;
}
