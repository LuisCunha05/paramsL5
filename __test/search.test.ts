import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CONDITIONS, URL_ENCODED_CHARS as URC } from '@/constants'
import { search } from '@/search'

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
const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
afterEach(() => {
  vi.clearAllMocks()
})

describe('search function', () => {
  describe('formatting', () => {
    test('should format a single search param correctly with default condition "="', () => {
      input = [['name', 'John']]
      expected = `search=name${URC.COLON}John&searchFields=name${URC.COLON}${URC.EQUALS}`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should format a valid key-value pair with a specific condition', () => {
      input = [['age', 18, CONDITIONS.GTE]]
      expected = `search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should handle "in" condition with array of values', () => {
      input = [['status', ['active', 'pending'], CONDITIONS.IN]]
      expected = `search=status${URC.COLON}active${URC.COMMA}pending&searchFields=status${URC.COLON}in`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should handle "in" condition with array of length 1', () => {
      input = [['status', ['active'], CONDITIONS.IN]]
      expected = `search=status${URC.COLON}active&searchFields=status${URC.COLON}in`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should handle "bitween" condition with tuple of values', () => {
      input = [['date', ['2023-01-01', '2023-12-31'], CONDITIONS.BTW]]
      expected = `search=date${URC.COLON}2023-01-01${URC.COMMA}2023-12-31&searchFields=date${URC.COLON}bitween`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should update the value if the key already exists (deduplication)', () => {
      input = [
        ['name', 'John', CONDITIONS.LIKE],
        ['name', 'Doe', CONDITIONS.LIKE],
      ]
      expected = `search=name${URC.COLON}Doe&searchFields=name${URC.COLON}like`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should format multiple search params correctly', () => {
      input = [
        ['name', 'John', CONDITIONS.LIKE],
        ['email', 'gmail', CONDITIONS.ILIKE],
      ]
      expected = `search=name${URC.COLON}John${URC.SEMICOLON}email${URC.COLON}gmail&searchFields=name${URC.COLON}like${URC.SEMICOLON}email${URC.COLON}ilike`

      result = search(input)

      expect(result).toBe(expected)
    })
  })

  describe('validations and edge cases', () => {
    test('should return undefined if called with no arguments', () => {
      result = search()

      expect(result).toBeUndefined()
    })

    test('should return undefined if called with an empty array', () => {
      input = []
      result = search(input)

      expect(result).toBeUndefined()
    })

    test('should return undefined if argument is not an array', () => {
      input = 'invalid'
      result = search(input)

      expect(result).toBeUndefined()
    })

    test('should ignore item if it is not an array', () => {
      input = [['name', 'John'], 'invalid']
      expected = `search=name${URC.COLON}John&searchFields=name${URC.COLON}${URC.EQUALS}`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should return undefined if key is not a non-empty string', () => {
      input = [['', 'value']]
      result = search(input)

      expect(result).toBeUndefined()
    })

    test('should ignore entries if value is null or undefined', () => {
      input = [
        ['status', 'active', CONDITIONS.EQ],
        ['ignored', null],
        ['alsoIgnored', undefined],
      ]
      expected = `search=status${URC.COLON}active&searchFields=status${URC.COLON}${URC.EQUALS}`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should ignore entries with invalid condition', () => {
      input = [
        ['name', 'John', 'INVALID_CONDITION'],
        ['status', 'active'],
      ]
      expected = `search=status${URC.COLON}active&searchFields=status${URC.COLON}${URC.EQUALS}`

      result = search(input)

      expect(result).toBe(expected)
    })

    test('should ignore array value if it is empty or has invalid items', () => {
      input = [
        ['status', 'active', CONDITIONS.EQ],
        ['emptyArray', [], CONDITIONS.IN],
        ['invalidArray', [{}], CONDITIONS.IN],
      ]
      expected = `search=status${URC.COLON}active&searchFields=status${URC.COLON}${URC.EQUALS}`

      result = search(input)

      expect(result).toBe(expected)
    })

    test("shouldn't handle array value for non 'in' condition", () => {
      input = [['status', [1, 2, 3], CONDITIONS.DIFF]]
      expected = `search=status${URC.COLON}active${URC.COMMA}pending&searchFields=status${URC.COLON}in`

      result = search(input)

      expect(result).toBeUndefined()
    })

    test("shouldn't handle array value for non 'bitween' condition", () => {
      input = [['status', ['active', 'pending'], CONDITIONS.GT]]
      expected = `search=status${URC.COLON}active${URC.COMMA}pending&searchFields=status${URC.COLON}in`

      result = search(input)

      expect(result).toBeUndefined()
    })

    test("shouldn't handle array with length less than 2 for 'bitween' condition", () => {
      input = [['status', ['active'], CONDITIONS.BTW]]

      result = search(input)

      expect(result).toBeUndefined()
    })

    test("shouldn't handle array with length more than 2 for 'bitween' condition", () => {
      input = [['status', [1, 2, 3], CONDITIONS.BTW]]

      result = search(input)

      expect(result).toBeUndefined()
    })
  })

  describe('Search logging', () => {
    test('should log error if key is not a non-empty string', () => {
      input = [['', 'value']]
      search(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Search must have keys as non-empty strings'),
      )
    })

    test('should log error if item is not an array', () => {
      input = [['name', 'John'], 'invalid']
      search(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Search must have a type of array'),
      )
    })

    test('should log error if argument is not an array', () => {
      input = 'invalid'
      search(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Search keys must have a type of array'),
      )
    })

    test('should log error if item length is less than 2', () => {
      input = [['name']]
      search(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Search must have a key-value array'),
      )
    })

    test('should log warn if array value is missing condition', () => {
      input = [['status', ['active', 'pending']]]
      search(input)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Ignoring array value in Search because of missing condition',
        ),
      )
    })

    test('should log warn if array value has invalid condition', () => {
      input = [['status', ['active', 'pending'], CONDITIONS.EQ]]
      search(input)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Ignoring array value in Search because got an array value for condition that is not 'in' or 'bitween'",
        ),
      )
    })

    test('should log warn if array value for bitween condition does not have size 2', () => {
      input = [['date', ['2023-01-01'], CONDITIONS.BTW]]
      search(input)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Ignoring array value in Search because expected array with size 2 for condition 'bitween'",
        ),
      )
    })

    test('should log warn if value is not a BaseValue', () => {
      input = [['name', { obj: true }]]
      search(input)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Ignoring value in Search because of incorrect type',
        ),
      )
    })

    test('should log warn if condition is invalid', () => {
      input = [['name', 'John', 'INVALID_CONDITION']]
      search(input)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Ignoring value for Condition in search because it didn't match possible values",
        ),
      )
    })
  })
})
