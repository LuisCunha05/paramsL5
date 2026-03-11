import type { TParams, TResultParams } from '@/paramsL5'
import { filter } from './generators/filter'
import { include } from './generators/include'
import { limit, type TLimit } from './generators/limit'
import { orderBySortBy, type TSortBy } from './generators/orderBySortBy'
import { page, type TPage } from './generators/page'
import { search, type TCondition } from './generators/search'
import { searchCriteria } from './generators/searchCriteria'
import { searchJoin, type TSearchJoin } from './generators/searchJoin'
import { withRel } from './generators/with'

type DefaultOptions = {
  sortBy?: TSortBy
  page?: TPage
  limit?: TLimit
  searchJoin?: TSearchJoin
  searchCondition?: TCondition
}

export type ClientOptions = {
  defaultOptions?: DefaultOptions
}

export function createClient(options: ClientOptions = {}) {
  return (params: TParams = {}) => {
    const searchObj = search(params.search, {
      defaultCondition: options?.defaultOptions?.searchCondition,
    })

    const result: TResultParams = {
      filter: filter(params.filter),
      include: include(params.include),
      limit: limit(params.limit ?? options?.defaultOptions?.limit),
      orderBySortBy: orderBySortBy(params.orderBySortBy, {
        defaultSortBy: options?.defaultOptions?.sortBy,
      }),
      page: page(params.page ?? options?.defaultOptions?.page),
      search: searchObj?.search ?? null,
      searchFields: searchObj?.searchFields ?? null,
      searchCriteria: searchCriteria(params.searchCriteria),
      searchJoin: searchJoin(
        params.searchJoin ?? options?.defaultOptions?.searchJoin,
      ),
      with: withRel(params.with),
      params: undefined,
    }

    result.params = Object.values(result).filter(Boolean).join('&')
    return result
  }
}
