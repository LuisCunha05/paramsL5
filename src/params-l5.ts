import { type TFilter, filter } from '@/generators/filter';
import { type TInclude, include } from '@/generators/include';
import { type TLimit, limit } from '@/generators/limit';
import { type TOrderBySortBy, orderBySortBy } from '@/generators/order-sort';
import { type TPage, page } from '@/generators/page';
import { type TSearch, search } from '@/generators/search';
import {
  type TSearchCriteria,
  searchCriteria,
} from '@/generators/search-criteria';
import { type TSearchJoin, searchJoin } from '@/generators/search-join';
import { type TWith, withRel } from '@/generators/with';

export interface TParams<TShape = Record<string, unknown>> {
  readonly filter?: TFilter<TShape>;
  readonly include?: TInclude<TShape>;
  readonly limit?: TLimit;
  readonly orderBySortBy?: TOrderBySortBy;
  readonly page?: TPage;
  readonly search?: TSearch;
  readonly searchCriteria?: TSearchCriteria;
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
  params: string | undefined;
}

export function paramsL5(arg: TParams = {}) {
  const searchObj = search(arg.search);
  const orderBySortByObj = orderBySortBy(arg.orderBySortBy);

  const result: TResultParams = {
    filter: filter(arg.filter),
    include: include(arg.include),
    limit: limit(arg.limit),
    orderBy: orderBySortByObj.orderBy,
    page: page(arg.page),
    params: undefined,
    search: searchObj.search,
    searchCriteria: searchCriteria(arg.searchCriteria),
    searchFields: searchObj.searchFields,
    searchJoin: searchJoin(arg.searchJoin),
    sortBy: orderBySortByObj.sortedBy,
    with: withRel(arg.with),
  };

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

  result.params = params.toString();
  return result;
}
