import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { LOG_LEVEL, SORT_BY, URL_ENCODED_CHARS as URC } from '@/constants'
import { orderBySortBy } from '@/generators/orderBySortBy'
import { Logger } from '@/logger'

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any

const info = vi.fn()
const warn = vi.fn()
const error = vi.fn()
const logger = { info, warn, error }
const noOpLogger = Logger({ logLevel: LOG_LEVEL.NONE })

beforeEach(() => {
  input = undefined
  result = undefined
  expected = undefined
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('orderBySortBy function', () => {
  describe('formatting', () => {
    test('should generate correct URL params for a single order/sort pair', () => {
      input = [['name', SORT_BY.ASC]]
      expected = {
        orderBy: { raw: 'name', encoded: 'name' },
        sortedBy: { raw: 'asc', encoded: 'asc' },
      }

      result = orderBySortBy(input)

      expect(result).toEqual(expected)
    })

    test('should generate correct string params with multiple order/sort pairs', () => {
      input = [
        ['name', SORT_BY.ASC],
        ['age', SORT_BY.DESC],
        ['created_at', SORT_BY.ASC],
      ]
      expected = {
        orderBy: {
          raw: 'name;age;created_at',
          encoded: `name${URC.SEMICOLON}age${URC.SEMICOLON}created_at`,
        },
        sortedBy: {
          raw: 'asc;desc;asc',
          encoded: `asc${URC.SEMICOLON}desc${URC.SEMICOLON}asc`,
        },
      }

      result = orderBySortBy(input)

      expect(result).toEqual(expected)
    })

    test('should deduplicate keys and capture the last element with same key', () => {
      input = [
        ['name', SORT_BY.ASC],
        ['name', SORT_BY.DESC],
      ]
      expected = {
        orderBy: { raw: 'name', encoded: 'name' },
        sortedBy: { raw: 'desc', encoded: 'desc' },
      }

      result = orderBySortBy(input)

      expect(result).toEqual(expected)
    })

    test('should allow multiple single value arrays', () => {
      input = [['key1'], ['key2']]
      expected = {
        orderBy: {
          raw: 'key1;key2',
          encoded: `key1${URC.SEMICOLON}key2`,
        },
        sortedBy: {
          raw: 'asc;asc',
          encoded: `asc${URC.SEMICOLON}asc`,
        },
      }

      result = orderBySortBy(input)

      expect(result).toEqual(expected)
    })
  })

  describe('default options', () => {
    test('should allow key-only value with default ASC sortBy', () => {
      input = [['key']]
      expected = {
        orderBy: { raw: 'key', encoded: 'key' },
        sortedBy: { raw: 'asc', encoded: 'asc' },
      }

      result = orderBySortBy(input)

      expect(result).toEqual(expected)
    })

    test('should change the default sortBy', () => {
      input = [['key']]
      expected = {
        orderBy: { raw: 'key', encoded: 'key' },
        sortedBy: { raw: 'desc', encoded: 'desc' },
      }

      result = orderBySortBy(input, { defaultSortBy: SORT_BY.DESC })

      expect(result).toEqual(expected)
    })

    test('should allow multiple single value arrays with the default sortBy', () => {
      input = [['key1'], ['key2']]
      expected = {
        orderBy: {
          raw: 'key1;key2',
          encoded: `key1${URC.SEMICOLON}key2`,
        },
        sortedBy: {
          raw: 'desc;desc',
          encoded: `desc${URC.SEMICOLON}desc`,
        },
      }

      result = orderBySortBy(input, { defaultSortBy: SORT_BY.DESC })

      expect(result).toEqual(expected)
    })
  })

  describe('validations and edge cases', () => {
    test('should return empty result with empty input', () => {
      expected = {
        orderBy: undefined,
        sortedBy: undefined,
      }

      result = orderBySortBy()

      expect(result).toEqual(expected)
    })

    test('should return empty result if called with a non-array', () => {
      input = {}
      expected = {
        orderBy: undefined,
        sortedBy: undefined,
      }

      result = orderBySortBy(input, { logger: noOpLogger })

      expect(result).toEqual(expected)
    })

    test('should return empty result if all items are invalid', () => {
      input = ['invalid']
      expected = {
        orderBy: undefined,
        sortedBy: undefined,
      }

      result = orderBySortBy(input, { logger: noOpLogger })

      expect(result).toEqual(expected)
    })
  })

  describe('OrderBySortBy logging', () => {
    test('should log error if arg is not an array', () => {
      input = {}

      orderBySortBy(input, { logger })

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'OrderBySortBy: keys must have a type of array, got object instead',
      )
    })

    test('should log error if an item is not an array', () => {
      input = ['invalid']

      orderBySortBy(input, { logger })

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'OrderBySortBy: must have a type of array, got string instead',
      )
    })

    test('should log error if an item is empty', () => {
      input = [[]]

      orderBySortBy(input, { logger })

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'OrderBySortBy: must have a key-value array, but got length 0 at index 0 instead',
      )
    })

    test('should log error if an item has too many elements', () => {
      input = [['alog', 'acs', 'bla']]

      orderBySortBy(input, { logger })

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'OrderBySortBy: must have a key-value array, but got length 3 at index 0 instead',
      )
    })

    test('should log error if key is not a non-empty string', () => {
      input = [[123, SORT_BY.ASC]]

      orderBySortBy(input, { logger })

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'OrderBySortBy: must have keys as non-empty strings, but got number at index 0 instead',
      )
    })

    test('should log error if sort value is not a valid SORT_BY value', () => {
      input = [['name', 'invalid_sort']]

      orderBySortBy(input, { logger })

      expect(error).toHaveBeenCalledExactlyOnceWith(
        'OrderBySortBy: must have a valid SORT_BY value, but got invalid_sort at index 0 instead',
      )
    })
  })
})
