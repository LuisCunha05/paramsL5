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
import type { ILogger } from './types';

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

export function createClient(options: ClientOptions = {}) {
  return (params: TParams = {}) => {
    const { logger } = options;
    const searchObj = search(params.search, {
      defaultCondition: options?.defaultOptions?.searchCondition,
      logger,
    });

    const orderBySortByObj = orderBySortBy(params.orderBySortBy, {
      defaultSortBy: options?.defaultOptions?.sortBy,
      logger,
    });

    const result: TResultParams = {
      filter: filter(params.filter, { logger }),
      include: include(params.include, { logger }),
      limit: limit(params.limit ?? options?.defaultOptions?.limit, { logger }),
      orderBy: orderBySortByObj.orderBy,
      page: page(params.page ?? options?.defaultOptions?.page, { logger }),
      params: undefined,
      search: searchObj?.search,
      searchCriteria: searchCriteria(params.searchCriteria, { logger }),
      searchFields: searchObj?.searchFields,
      searchJoin: searchJoin(
        params.searchJoin ?? options?.defaultOptions?.searchJoin,
        { logger },
      ),
      sortBy: orderBySortByObj.sortedBy,
      with: withRel(params.with, { logger }),
    };

    const searchParams = new URLSearchParams();

    if (result.filter) {
      searchParams.append('filter', result.filter);
    }
    if (result.include) {
      searchParams.append('include', result.include);
    }
    if (result.limit) {
      searchParams.append('limit', result.limit);
    }
    if (result.orderBy) {
      searchParams.append('orderBy', result.orderBy);
    }
    if (result.sortBy) {
      searchParams.append('sortedBy', result.sortBy);
    }
    if (result.page) {
      searchParams.append('page', result.page);
    }
    if (result.search) {
      searchParams.append('search', result.search);
    }
    if (result.searchFields) {
      searchParams.append('searchFields', result.searchFields);
    }
    if (result.searchCriteria) {
      searchParams.append('searchCriteria', result.searchCriteria);
    }
    if (result.with) {
      searchParams.append('with', result.with);
    }
    if (result.searchJoin) {
      searchParams.append('searchJoin', result.searchJoin);
    }

    result.params = searchParams.toString();
    return result;
  };
}
