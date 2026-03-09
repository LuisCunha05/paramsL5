import { filter, type TFilter } from '@/generators/filter'
import { include, type TInclude } from '@/generators/include'
import { limit, type TLimit } from '@/generators/limit'
import { orderBySortBy, type TOrderBySortBy } from '@/generators/orderBySortBy'
import { page, type TPage } from '@/generators/page'
import { search, type TSearch } from '@/generators/search'
import {
  searchCriteria,
  type TSearchCriteria,
} from '@/generators/searchCriteria'
import { searchJoin, type TSearchJoin } from '@/generators/searchJoin'
import { type TWith, withRel } from '@/generators/with'

export type TParams = {
  filter?: TFilter
  include?: TInclude
  limit?: TLimit
  orderBySortBy?: TOrderBySortBy
  page?: TPage
  search?: TSearch
  searchCriteria?: TSearchCriteria
  searchJoin?: TSearchJoin
  with?: TWith
}

export type TResultParams = {
  filter: string | undefined
  include: string | undefined
  limit: string | undefined
  orderBySortBy: string | undefined
  page: string | undefined
  search: string | null
  searchFields: string | null
  searchCriteria: string | undefined
  searchJoin: string | undefined
  with: string | undefined
  params: string | undefined
}

export function paramsL5(arg: TParams = {} as TParams) {
  const searchObj = search(arg.search)

  const result: TResultParams = {
    filter: filter(arg.filter),
    include: include(arg.include),
    limit: limit(arg.limit),
    orderBySortBy: orderBySortBy(arg.orderBySortBy),
    page: page(arg.page),
    search: searchObj?.search ?? null,
    searchFields: searchObj?.searchFields ?? null,
    searchCriteria: searchCriteria(arg.searchCriteria),
    searchJoin: searchJoin(arg.searchJoin),
    with: withRel(arg.with),
    params: undefined,
  }

  result.params = Object.values(result).filter(Boolean).join('&')
  return result
}
