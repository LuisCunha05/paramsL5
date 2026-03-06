import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { URL_ENCODED_CHARS as URC } from '@/constants'
import { filter } from '@/generators/filter'

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any
let result: string | undefined
let expected: string | undefined

beforeEach(() => {
  input = undefined
  result = undefined
  expected = undefined
})

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

afterEach(() => {
  vi.clearAllMocks()
})

describe('filter function', () => {
  describe('formatting', () => {
    test('should format a valid array of strings', () => {
      input = ['a', 'b', 'c']
      expected = `filter=a${URC.SEMICOLON}b${URC.SEMICOLON}c`

      result = filter(input)

      expect(result).toBe(expected)
    })

    test('should return unique values if there are duplicates', () => {
      input = ['a', 'b', 'a', 'c', 'b']
      expected = `filter=a${URC.SEMICOLON}b${URC.SEMICOLON}c`

      result = filter(input)

      expect(result).toBe(expected)
    })
  })

  describe('validations and edge cases', () => {
    test('should return undefined if called with a non-array', () => {
      input = 'not an array'

      result = filter(input)

      expect(result).toBeUndefined()
    })

    test('should filter out non-string items', () => {
      input = ['a', 123, 'b']
      expected = `filter=a${URC.SEMICOLON}b`

      result = filter(input)

      expect(result).toBe(expected)
    })

    test('should filter out empty strings', () => {
      input = ['a', '', 'b', '   ']
      expected = `filter=a${URC.SEMICOLON}b`

      result = filter(input)

      expect(result).toBe(expected)
    })
  })

  describe('filter logging', () => {
    test('should log error if argument is not an array', () => {
      input = 'not an array'

      filter(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Argument of filter must be a array, got string instead',
        ),
      )
    })

    test('should log error if an item is not a string', () => {
      input = ['a', 123]

      filter(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Include value must be a string, got Array instead',
        ),
      )
    })
  })
})
