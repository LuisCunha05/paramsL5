import { afterEach, describe, expect, test, vi } from 'vitest'
import { Condition, search } from '@/search'

describe('search function', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('validations and edge cases', () => {
    test('should return undefined if called with no arguments or empty array', () => {
      expect(search()).toBeUndefined()
      expect(search([])).toBeUndefined()
    })

    test('should log error and return undefined if argument is not an array', () => {
      // @ts-expect-error - Testing runtime validation
      expect(search('invalid')).toBeUndefined()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search keys must have a type of array'),
      )
    })

    test('should log error and ignore item if it is not an array', () => {
      // @ts-expect-error - Testing runtime validation
      const result = search([['name', 'John'], 'invalid'])
      expect(result).toBe('search=name%3AJohn&searchFields=name%3A%3D')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search must have a type of array'),
      )
    })

    test('should ignore entries if key is not a non-empty string', () => {
      expect(search([['', 'value']])).toBeUndefined()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search must have keys as non-empty strings'),
      )
    })

    test('should ignore entries if value is null or undefined', () => {
      const input = [
        ['status', 'active', Condition.EQ],
        ['ignored', null],
        ['alsoIgnored', undefined],
      ] as const

      const result = search(input)

      expect(result).toBe('search=status%3Aactive&searchFields=status%3A%3D')
    })

    test('should ignore entries with invalid condition', () => {
      const result = search([
        //@ts-expect-error
        ['name', 'John', 'INVALID_CONDITION'],
        ['status', 'active'],
      ])
      expect(result).toBe('search=status%3Aactive&searchFields=status%3A%3D')
    })

    test('should ignore array value if it is empty or has invalid items', () => {
      const result = search([
        ['status', 'active', Condition.EQ],
        ['emptyArray', [], Condition.IN],
        ['invalidArray', [{}], Condition.IN],
      ])
      expect(result).toBe('search=status%3Aactive&searchFields=status%3A%3D')
    })
  })

  describe('formatting', () => {
    test('should format a single search param correctly with default condition "="', () => {
      const result = search([['name', 'John']])
      expect(result).toBe('search=name%3AJohn&searchFields=name%3A%3D')
    })

    test('should format a valid key-value pair with a specific condition', () => {
      const result = search([['age', 18, Condition.GTE]])
      expect(result).toBe('search=age%3A18&searchFields=age%3A%3E%3D')
    })

    test('should handle "in" condition with array of values', () => {
      const result = search([['status', ['active', 'pending'], Condition.IN]])
      // Comma is usually %2C in URLSearchParams
      expect(result).toBe(
        'search=status%3Aactive%2Cpending&searchFields=status%3Ain',
      )
    })

    test('should handle "between" condition with tuple of values', () => {
      const result = search([
        ['date', ['2023-01-01', '2023-12-31'], Condition.BTW],
      ])
      expect(result).toBe(
        'search=date%3A2023-01-01%2C2023-12-31&searchFields=date%3Abetween',
      )
    })

    test('should update the value if the key already exists (deduplication)', () => {
      const result = search([
        ['name', 'John', Condition.LIKE],
        ['name', 'Doe', Condition.LIKE],
      ])
      expect(result).toBe('search=name%3ADoe&searchFields=name%3Alike')
    })

    test('should format multiple search params correctly', () => {
      const result = search([
        ['name', 'John', Condition.LIKE],
        ['email', 'gmail', Condition.ILIKE],
      ])
      // Semicolon is %3B
      expect(result).toBe(
        'search=name%3AJohn%3Bemail%3Agmail&searchFields=name%3Alike%3Bemail%3Ailike',
      )
    })
  })
})
