import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createClient } from '@/client'
import { CONDITIONS, URL_ENCODED_CHARS as URC } from '@/constants'
import type { TResultParams } from '@/paramsL5'

let result: TResultParams | undefined
let expected: string | undefined

beforeEach(() => {
  result = undefined
  expected = undefined
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('createClient function', () => {
  describe('global', () => {
    test('should return all default properties correctly without params', () => {
      expected = `limit=77&orderBy=name&sortedBy=desc&page=2&search=name${URC.COLON}john&searchFields=name${URC.COLON}like&searchJoin=or`

      const paramsL5 = createClient({
        defaultOptions: {
          limit: 77,
          page: 2,
          sortBy: 'desc',
          searchJoin: 'or',
          searchCondition: CONDITIONS.LIKE,
        },
      })

      result = paramsL5({
        orderBySortBy: [['name']],
        search: [['name', 'john']],
      })

      expect(result.params).toBe(expected)
    })
  })

  describe('limit', () => {
    test('should change the default limit when defaultOptions is provided', () => {
      expected = 'limit=77'

      const paramsL5 = createClient({ defaultOptions: { limit: 77 } })

      result = paramsL5()

      expect(result?.limit).toBe(expected)
    })

    test('should prioritize limit from params over defaultOptions', () => {
      expected = 'limit=10'

      const paramsL5 = createClient({ defaultOptions: { limit: 77 } })

      result = paramsL5({ limit: 10 })

      expect(result?.limit).toBe(expected)
    })
  })

  describe('page', () => {
    test('should change the default page when defaultOptions is provided', () => {
      expected = 'page=2'

      const paramsL5 = createClient({ defaultOptions: { page: 2 } })

      result = paramsL5()

      expect(result?.page).toBe(expected)
    })

    test('should prioritize page from params over defaultOptions', () => {
      expected = 'page=3'

      const paramsL5 = createClient({ defaultOptions: { page: 2 } })

      result = paramsL5({ page: 3 })

      expect(result?.page).toBe(expected)
    })
  })

  describe('sortBy', () => {
    test('should change the default sortBy when defaultOptions is provided', () => {
      expected = 'orderBy=name&sortedBy=desc'

      const paramsL5 = createClient({ defaultOptions: { sortBy: 'desc' } })

      result = paramsL5({ orderBySortBy: [['name']] })

      expect(result?.orderBySortBy).toBe(expected)
    })

    test('should prioritize sortBy from params over defaultOptions', () => {
      expected = 'orderBy=name&sortedBy=asc'

      const paramsL5 = createClient({ defaultOptions: { sortBy: 'desc' } })

      result = paramsL5({ orderBySortBy: [['name', 'asc']] })

      expect(result?.orderBySortBy).toBe(expected)
    })
  })

  describe('searchJoin', () => {
    test('should change the default searchJoin when defaultOptions is provided', () => {
      expected = 'searchJoin=or'

      const paramsL5 = createClient({ defaultOptions: { searchJoin: 'or' } })

      result = paramsL5()

      expect(result?.searchJoin).toBe(expected)
    })

    test('should prioritize searchJoin from params over defaultOptions', () => {
      expected = 'searchJoin=and'

      const paramsL5 = createClient({ defaultOptions: { searchJoin: 'or' } })

      result = paramsL5({ searchJoin: 'and' })

      expect(result?.searchJoin).toBe(expected)
    })
  })

  describe('searchCondition', () => {
    test('should change the default searchCondition when defaultOptions is provided', () => {
      expected = `search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`

      const paramsL5 = createClient({
        defaultOptions: { searchCondition: CONDITIONS.GTE },
      })

      result = paramsL5({ search: [['age', 18]] })

      expect(`${result?.search}&${result?.searchFields}`).toBe(expected)
    })

    test('should prioritize searchCondition from params over defaultOptions', () => {
      expected = `search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.LESS_THAN}${URC.EQUALS}`

      const paramsL5 = createClient({
        defaultOptions: { searchCondition: CONDITIONS.GTE },
      })

      result = paramsL5({ search: [['age', 18, CONDITIONS.LTE]] })

      expect(`${result?.search}&${result?.searchFields}`).toBe(expected)
    })
  })
})
