import { type TFilter, filter } from '#s/generators/filter';
import { type TInclude, include } from '#s/generators/include';
import { type TLimit, limit } from '#s/generators/limit';
import { type TOrderBySortBy, orderBySortBy } from '#s/generators/order-sort';
import { type TPage, page } from '#s/generators/page';
import { type TSearch, search } from '#s/generators/search';
import {
  type TSearchCriteria,
  searchCriteria,
} from '#s/generators/search-criteria';
import { type TSearchJoin, searchJoin } from '#s/generators/search-join';
import { type TWith, withRel } from '#s/generators/with';

export interface TParams<TShape extends object = Record<string, unknown>> {
  readonly filter?: TFilter<TShape>;
  readonly include?: TInclude<TShape>;
  readonly limit?: TLimit;
  readonly orderBySortBy?: TOrderBySortBy<TShape>;
  readonly page?: TPage;
  readonly search?: TSearch<TShape>;
  readonly searchCriteria?: TSearchCriteria<TShape>;
  readonly searchJoin?: TSearchJoin;
  readonly with?: TWith<TShape>;
}

export interface TResultParams {
  filter: string | undefined;
  include: string | undefined;
  limit: string | undefined;
  orderBy: string | undefined;
  sortBy: string | undefined;
  page: string | undefined;
  search: string | undefined;
  searchFields: string | undefined;
  searchCriteria: string | undefined;
  searchJoin: string | undefined;
  with: string | undefined;
  toParams: () => string | undefined;
}

export function paramsL5<TShape extends object = Record<string, unknown>>(
  arg: TParams<TShape> = {},
) {
  function toParams() {
    const params = new URLSearchParams();

    if (result.filter) {
      params.append('filter', result.filter);
    }
    if (result.include) {
      params.append('include', result.include);
    }
    if (result.limit) {
      params.append('limit', result.limit);
    }
    if (result.orderBy) {
      params.append('orderBy', result.orderBy);
    }
    if (result.sortBy) {
      params.append('sortedBy', result.sortBy);
    }
    if (result.page) {
      params.append('page', result.page);
    }
    if (result.search) {
      params.append('search', result.search);
    }
    if (result.searchFields) {
      params.append('searchFields', result.searchFields);
    }
    if (result.searchCriteria) {
      params.append('searchCriteria', result.searchCriteria);
    }
    if (result.with) {
      params.append('with', result.with);
    }
    if (result.searchJoin) {
      params.append('searchJoin', result.searchJoin);
    }

    return params.toString();
  }

  const searchObj = search(arg.search);
  const orderBySortByObj = orderBySortBy(arg.orderBySortBy);

  const result: TResultParams = {
    filter: filter(arg.filter),
    include: include(arg.include),
    limit: limit(arg.limit),
    orderBy: orderBySortByObj.orderBy,
    page: page(arg.page),
    search: searchObj.search,
    searchCriteria: searchCriteria(arg.searchCriteria),
    searchFields: searchObj.searchFields,
    searchJoin: searchJoin(arg.searchJoin),
    sortBy: orderBySortByObj.sortedBy,
    toParams,
    with: withRel(arg.with),
  };

  return result;
}
