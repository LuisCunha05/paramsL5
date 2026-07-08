import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { URL_ENCODED_CHARS as URC } from '@/constants'
import { filter } from '@/generators/filter'

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

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

afterEach(() => {
  vi.clearAllMocks()
})

describe('filter function', () => {
  describe('formatting', () => {
    test('should format a valid array of strings', () => {
      input = ['a', 'b', 'c']
      expected = {
        raw: 'a;b;c',
        encoded: `a${URC.SEMICOLON}b${URC.SEMICOLON}c`,
      }

      result = filter(input)

      expect(result).toEqual(expected)
    })

    test('should return unique values if there are duplicates', () => {
      input = ['a', 'b', 'a', 'c', 'b']
      expected = {
        raw: 'a;b;c',
        encoded: `a${URC.SEMICOLON}b${URC.SEMICOLON}c`,
      }

      result = filter(input)

      expect(result).toEqual(expected)
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
      expected = {
        raw: 'a;b',
        encoded: `a${URC.SEMICOLON}b`,
      }

      result = filter(input)

      expect(result).toEqual(expected)
    })

    test('should filter out empty strings', () => {
      input = ['a', '', 'b', '   ']
      expected = {
        raw: 'a;b',
        encoded: `a${URC.SEMICOLON}b`,
      }

      result = filter(input)

      expect(result).toEqual(expected)
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

    test('should log warn if an item is not a string', () => {
      input = ['a', 123]

      filter(input)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Include value must be a string, got Array instead',
        ),
      )
    })
  })
})
