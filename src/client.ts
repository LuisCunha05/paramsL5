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
import type { ILogger } from './types'

type DefaultOptions = {
  sortBy?: TSortBy
  page?: TPage
  limit?: TLimit
  searchJoin?: TSearchJoin
  searchCondition?: TCondition
}

export type ClientOptions = {
  defaultOptions?: DefaultOptions
  logger?: ILogger
}

export function createClient(options: ClientOptions = {}) {
  return (params: TParams = {}) => {
    const logger = options.logger
    const searchObj = search(params.search, {
      defaultCondition: options?.defaultOptions?.searchCondition,
      logger,
    })

    const orderBySortByObj = orderBySortBy(params.orderBySortBy, {
      defaultSortBy: options?.defaultOptions?.sortBy,
      logger,
    })

    const result: TResultParams = {
      filter: filter(params.filter, { logger }),
      include: include(params.include, { logger }),
      limit: limit(params.limit ?? options?.defaultOptions?.limit, { logger }),
      orderBy: orderBySortByObj.orderBy,
      sortBy: orderBySortByObj.sortedBy,
      page: page(params.page ?? options?.defaultOptions?.page, { logger }),
      search: searchObj?.search,
      searchFields: searchObj?.searchFields,
      searchCriteria: searchCriteria(params.searchCriteria, { logger }),
      searchJoin: searchJoin(
        params.searchJoin ?? options?.defaultOptions?.searchJoin,
        { logger },
      ),
      with: withRel(params.with, { logger }),
      params: undefined,
    }

    const searchParams = new URLSearchParams()

    if (result.filter?.raw) searchParams.append('filter', result.filter.raw)
    if (result.include?.raw) searchParams.append('include', result.include.raw)
    if (result.limit) searchParams.append('limit', result.limit)
    if (result.orderBy?.raw) searchParams.append('orderBy', result.orderBy.raw)
    if (result.sortBy?.raw) searchParams.append('sortedBy', result.sortBy.raw)
    if (result.page) searchParams.append('page', result.page)
    if (result.search?.raw) searchParams.append('search', result.search.raw)
    if (result.searchFields?.raw)
      searchParams.append('searchFields', result.searchFields.raw)
    if (result.searchCriteria?.raw)
      searchParams.append('searchCriteria', result.searchCriteria.raw)
    if (result.with?.raw) searchParams.append('with', result.with.raw)
    if (result.searchJoin) searchParams.append('searchJoin', result.searchJoin)

    result.params = searchParams.toString()
    return result
  }
}
