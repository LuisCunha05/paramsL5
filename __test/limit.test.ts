import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { limit } from '@/generators/limit'

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
afterEach(() => {
  vi.clearAllMocks()
})

describe('limit function', () => {
  describe('formatting', () => {
    test('should set limit to a parameter', () => {
      input = 7
      expected = '7'

      result = limit(input)

      expect(result).toBe(expected)
    })

    test('should have a default value', () => {
      result = limit()

      expect(result).toBeUndefined()
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
      limit(input, { logger: console })

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got number instead',
        ),
      )
    })

    test('should log error if argument is null', () => {
      input = null
      limit(input, { logger: console })

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got null instead',
        ),
      )
    })

    test('should log error if argument is an object', () => {
      input = {}
      limit(input, { logger: console })

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got object instead',
        ),
      )
    })

    test('should log error if argument is an array', () => {
      input = []
      limit(input, { logger: console })

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got Array instead',
        ),
      )
    })

    test('should log error if argument is NaN', () => {
      input = NaN
      limit(input, { logger: console })

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Limit must be a positive integer or zero, got NaN instead',
        ),
      )
    })
  })
})
