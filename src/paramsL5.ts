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
  withRel?: TWith
}

export function paramsL5(arg: TParams = {} as TParams) {
  return [
    filter(arg.filter),
    include(arg.include),
    limit(arg.limit),
    orderBySortBy(arg.orderBySortBy),
    page(arg.page),
    search(arg.search),
    searchCriteria(arg.searchCriteria),
    searchJoin(arg.searchJoin),
    withRel(arg.withRel),
  ].join('&')
}
