import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { searchCriteria } from '@/generators/searchCriteria'

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  input = undefined
  result = undefined
  expected = undefined
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SearchCriteria params generation', () => {
  test('Should generate params correct string key-value', () => {
    input = [['key', 'value']]
    expected = {
      raw: 'key=value',
      encoded: 'key=value',
    }

    result = searchCriteria(input)

    expect(result).toEqual(expected)
  })

  test('Should generate params correct boolean(true) key-value', () => {
    input = [['key', true]]
    expected = {
      raw: 'key=true',
      encoded: 'key=true',
    }

    result = searchCriteria(input)

    expect(result).toEqual(expected)
  })

  test('Should generate params correct boolean(false) key-value', () => {
    input = [['key', false]]
    expected = {
      raw: 'key=false',
      encoded: 'key=false',
    }

    result = searchCriteria(input)

    expect(result).toEqual(expected)
  })

  test('Should generate params correct number key-value', () => {
    input = [['key', 7]]
    expected = {
      raw: 'key=7',
      encoded: 'key=7',
    }

    result = searchCriteria(input)

    expect(result).toEqual(expected)
  })

  test('Should generate string params with multiple key-values', () => {
    input = [
      ['key1', 'value'],
      ['key2', 777],
      ['key3', false],
    ]
    expected = {
      raw: 'key1=value&key2=777&key3=false',
      encoded: 'key1=value&key2=777&key3=false',
    }

    result = searchCriteria(input)

    expect(result).toEqual(expected)
  })

  test('Should capture the last element with same key', () => {
    input = [
      ['key', 'value1'],
      ['key', 'value2'],
    ]
    expected = {
      raw: 'key=value2',
      encoded: 'key=value2',
    }

    result = searchCriteria(input)

    expect(result).toEqual(expected)
  })
})

describe('SearchCriteria validation', () => {
  test('Should return undefined with empty input', () => {
    result = searchCriteria()

    expect(result).toBeUndefined()
  })

  test("Shouldn't accept undefined for key", () => {
    input = [[undefined, 'value1']]

    result = searchCriteria(input)

    expect(result).toBeUndefined()
  })

  test("Shouldn't accept number for key", () => {
    input = [[2, 'value1']]

    result = searchCriteria(input)

    expect(result).toBeUndefined()
  })

  test("Shouldn't accept object for key", () => {
    input = [[{}, 'value1']]

    result = searchCriteria(input)

    expect(result).toBeUndefined()
  })

  test("Shouldn't accept array for key", () => {
    input = [[[], 'value1']]

    result = searchCriteria(input)

    expect(result).toBeUndefined()
  })

  test("Shouldn't accept null for key", () => {
    input = [[null, 'value1']]

    result = searchCriteria(input)

    expect(result).toBeUndefined()
  })

  test("Shouldn't accept undefined for value", () => {
    input = [['key']]

    result = searchCriteria(input)

    expect(result).toBeUndefined()
  })
})

describe('SearchCriteria logging', () => {
  test('should log error if arg is not an array', () => {
    input = {}

    searchCriteria(input, { logger: console })

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'SearchCriteria keys must have a type of array, got object instead',
      ),
    )
  })

  test('should log error if item is not an array', () => {
    input = ['invalid']

    searchCriteria(input, { logger: console })

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'SearchCriteria must have a type of array, got string instead',
      ),
    )
  })

  test('should log error if item does not have exactly 2 elements', () => {
    input = [['key']]

    searchCriteria(input, { logger: console })

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'SearchCriteria must have a key-value array, but got length 1 at index 0 instead',
      ),
    )
  })

  test('should log error if key is not a non-empty string', () => {
    input = [[123, 'value']]

    searchCriteria(input, { logger: console })

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'SearchCriteria must have keys as non-empty strings, but got number at index 0 instead',
      ),
    )
  })
})
