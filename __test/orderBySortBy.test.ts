import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { SORT_BY, URL_ENCODED_CHARS as URC } from '@/constants'
import { orderBySortBy } from '@/orderBySortBy'

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any
let result: string | undefined
let expected: string | undefined

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

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
      expected = 'orderBy=name&sortedBy=asc'

      result = orderBySortBy(input)

      expect(result).toBe(expected)
    })

    test('should generate correct string params with multiple order/sort pairs', () => {
      input = [
        ['name', SORT_BY.ASC],
        ['age', SORT_BY.DESC],
        ['created_at', SORT_BY.ASC],
      ]
      expected = `orderBy=name${URC.SEMICOLON}age${URC.SEMICOLON}created_at&sortedBy=asc${URC.SEMICOLON}desc${URC.SEMICOLON}asc`

      result = orderBySortBy(input)

      expect(result).toBe(expected)
    })

    test('should deduplicate keys and capture the last element with same key', () => {
      input = [
        ['name', SORT_BY.ASC],
        ['name', SORT_BY.DESC],
      ]
      expected = 'orderBy=name&sortedBy=desc'

      result = orderBySortBy(input)

      expect(result).toBe(expected)
    })
  })

  describe('validations and edge cases', () => {
    test('should return undefined with empty input', () => {
      expect(orderBySortBy()).toBeUndefined()
    })

    test('should log error if arg is not an array', () => {
      input = {}
      orderBySortBy(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'OrderBySortBy keys must have a type of array, got object instead',
        ),
      )
    })

    test('should log error if an item is not an array', () => {
      input = ['invalid']
      orderBySortBy(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'OrderBySortBy must have a type of array, got string instead',
        ),
      )
    })

    test('should log error if an item does not have exactly 2 elements', () => {
      input = [['name']]
      orderBySortBy(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'OrderBySortBy must have a key-value array, but got length 1 at index 0 instead',
        ),
      )
    })

    test('should log error if key is not a non-empty string', () => {
      input = [[123, SORT_BY.ASC]]
      orderBySortBy(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'OrderBySortBy must have keys as non-empty strings, but got number at index 0 instead',
        ),
      )
    })

    test('should log error if sort value is not a valid SORT_BY value', () => {
      input = [['name', 'invalid_sort']]
      orderBySortBy(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'OrderBySortBy must have a valid SORT_BY value, but got invalid_sort at index 0 instead',
        ),
      )
    })
  })
})
