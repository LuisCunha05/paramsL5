import { filter, type TFilter } from "@/generators/filter";
import { include, type TInclude } from "@/generators/include";
import { limit, type TLimit } from "@/generators/limit";
import { orderBySortBy, type TOrderBySortBy } from "@/generators/orderBySortBy";
import { page, type TPage } from "@/generators/page";
import { search, type TSearch } from "@/generators/search";
import {
  searchCriteria,
  type TSearchCriteria,
} from "@/generators/searchCriteria";
import { searchJoin, type TSearchJoin } from "@/generators/searchJoin";
import { type TWith, withRel } from "@/generators/with";

import type { TResult } from "./types";

export type TParams = {
  filter?: TFilter;
  include?: TInclude;
  limit?: TLimit;
  orderBySortBy?: TOrderBySortBy;
  page?: TPage;
  search?: TSearch;
  searchCriteria?: TSearchCriteria;
  searchJoin?: TSearchJoin;
  with?: TWith;
};

export type TResultParams = {
  filter: TResult | undefined;
  include: TResult | undefined;
  limit: string | undefined;
  orderBy: TResult | undefined;
  sortBy: TResult | undefined;
  page: string | undefined;
  search: TResult | undefined;
  searchFields: TResult | undefined;
  searchCriteria: TResult | undefined;
  searchJoin: string | undefined;
  with: TResult | undefined;
  params: string | undefined;
};

export function paramsL5(arg: Readonly<TParams> = {}) {
  const searchObj = search(arg.search);
  const orderBySortByObj = orderBySortBy(arg.orderBySortBy);

  const result: TResultParams = {
    filter: filter(arg.filter),
    include: include(arg.include),
    limit: limit(arg.limit),
    orderBy: orderBySortByObj.orderBy,
    sortBy: orderBySortByObj.sortedBy,
    page: page(arg.page),
    search: searchObj.search,
    searchFields: searchObj.searchFields,
    searchCriteria: searchCriteria(arg.searchCriteria),
    searchJoin: searchJoin(arg.searchJoin),
    with: withRel(arg.with),
    params: undefined,
  };

  const params = new URLSearchParams();

  if (result.filter?.raw) params.append("filter", result.filter.raw);
  if (result.include?.raw) params.append("include", result.include.raw);
  if (result.limit) params.append("limit", result.limit);
  if (result.orderBy?.raw) params.append("orderBy", result.orderBy.raw);
  if (result.sortBy?.raw) params.append("sortedBy", result.sortBy.raw);
  if (result.page) params.append("page", result.page);
  if (result.search?.raw) params.append("search", result.search.raw);
  if (result.searchFields?.raw)
    params.append("searchFields", result.searchFields.raw);
  if (result.searchCriteria?.raw)
    params.append("searchCriteria", result.searchCriteria.raw);
  if (result.with?.raw) params.append("with", result.with.raw);
  if (result.searchJoin) params.append("searchJoin", result.searchJoin);

  result.params = params.toString();
  return result;
}
