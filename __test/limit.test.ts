import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { limit } from '@/limit'

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

describe('limit function', () => {
  describe('formatting', () => {
    test('should set limit to a parameter', () => {
      input = 7
      expected = 'limit=7'

      result = limit(input)

      expect(result).toBe(expected)
    })

    test('should have a default value', () => {
      expected = 'limit=10'

      result = limit()

      expect(result).toBe(expected)
    })
  })

  describe('validations and edge cases', () => {
    test('should return undefined if called with a negative number', () => {
      input = -10
      result = limit(input)

      expect(result).toBeUndefined()
    })

    test('should return undefined if called with a non-number', () => {
      input = null
      result = limit(input)

      expect(result).toBeUndefined()
    })
  })

  describe('Limit logging', () => {
    test('should log error if argument is a negative number', () => {
      input = -10
      limit(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got number instead',
        ),
      )
    })

    test('should log error if argument is null', () => {
      input = null
      limit(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got null instead',
        ),
      )
    })

    test('should log error if argument is an object', () => {
      input = {}
      limit(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got object instead',
        ),
      )
    })

    test('should log error if argument is an array', () => {
      input = []
      limit(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got Array instead',
        ),
      )
    })

    test('should log error if argument is NaN', () => {
      input = NaN
      limit(input)

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got NaN instead',
        ),
      )
    })
  })
})
