import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createClient } from '@/client'
import { CONDITIONS, LOG_LEVEL, URL_ENCODED_CHARS as URC } from '@/constants'
import { Logger } from '@/logger'

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any

beforeEach(() => {
  input = undefined
  result = undefined
  expected = undefined
})

const noOpLogger = Logger({ logLevel: LOG_LEVEL.NONE })

afterEach(() => {
  vi.clearAllMocks()
})

describe('createClient function', () => {
  describe('global', () => {
    test('should return all default properties correctly without params', () => {
      input = {
        orderBySortBy: [['name']],
        search: [['name', 'john']],
      }
      expected = `limit=77&orderBy=name&sortedBy=desc&page=2&search=name${URC.COLON}john&searchFields=name${URC.COLON}like&searchJoin=or`

      const paramsL5 = createClient({
        defaultOptions: {
          limit: 77,
          page: 2,
          sortBy: 'desc',
          searchJoin: 'or',
          searchCondition: CONDITIONS.LIKE,
        },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.params).toBe(expected)
    })
  })

  describe('limit', () => {
    test('should change the default limit when defaultOptions is provided', () => {
      expected = '77'

      const paramsL5 = createClient({
        defaultOptions: { limit: 77 },
        logger: noOpLogger,
      })

      result = paramsL5()

      expect(result?.limit).toBe(expected)
    })

    test('should prioritize limit from params over defaultOptions', () => {
      input = { limit: 10 }
      expected = '10'

      const paramsL5 = createClient({
        defaultOptions: { limit: 77 },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.limit).toBe(expected)
    })
  })

  describe('page', () => {
    test('should change the default page when defaultOptions is provided', () => {
      expected = '2'

      const paramsL5 = createClient({
        defaultOptions: { page: 2 },
        logger: noOpLogger,
      })

      result = paramsL5()

      expect(result?.page).toBe(expected)
    })

    test('should prioritize page from params over defaultOptions', () => {
      input = { page: 3 }
      expected = '3'

      const paramsL5 = createClient({
        defaultOptions: { page: 2 },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.page).toBe(expected)
    })
  })

  describe('sortBy', () => {
    test('should change the default sortBy when defaultOptions is provided', () => {
      input = { orderBySortBy: [['name']] }
      expected = 'desc'

      const paramsL5 = createClient({
        defaultOptions: { sortBy: 'desc' },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.sortBy?.raw).toBe(expected)
    })

    test('should prioritize sortBy from params over defaultOptions', () => {
      input = { orderBySortBy: [['name', 'asc']] }
      expected = 'asc'

      const paramsL5 = createClient({
        defaultOptions: { sortBy: 'desc' },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.sortBy?.raw).toBe(expected)
    })
  })

  describe('searchJoin', () => {
    test('should change the default searchJoin when defaultOptions is provided', () => {
      expected = 'or'

      const paramsL5 = createClient({
        defaultOptions: { searchJoin: 'or' },
        logger: noOpLogger,
      })

      result = paramsL5()

      expect(result?.searchJoin).toBe(expected)
    })

    test('should prioritize searchJoin from params over defaultOptions', () => {
      input = { searchJoin: 'and' }
      expected = 'and'

      const paramsL5 = createClient({
        defaultOptions: { searchJoin: 'or' },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.searchJoin).toBe(expected)
    })
  })

  describe('searchCondition', () => {
    test('should change the default searchCondition when defaultOptions is provided', () => {
      input = { search: [['age', 18]] }
      expected = `search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`

      const paramsL5 = createClient({
        defaultOptions: { searchCondition: CONDITIONS.GTE },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.params).toBe(expected)
    })

    test('should prioritize searchCondition from params over defaultOptions', () => {
      input = { search: [['age', 18, CONDITIONS.LTE]] }
      expected = `search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.LESS_THAN}${URC.EQUALS}`

      const paramsL5 = createClient({
        defaultOptions: { searchCondition: CONDITIONS.GTE },
        logger: noOpLogger,
      })

      result = paramsL5(input)

      expect(result?.params).toBe(expected)
    })
  })
})
