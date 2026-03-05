import { describe, expect, test } from 'vitest'
import { searchCriteria } from '@/searchCriteria'

describe('SearchCriteria params generation', () => {
  test('Should generate params correct string key-value', () => {
    const input = [['key', 'value'] as const]

    const result = searchCriteria(input)

    expect(result).toBe('key=value')
  })

  test('Should generate params correct boolean(true) key-value', () => {
    const input = [['key', true]] as const

    const result = searchCriteria(input)

    expect(result).toBe('key=true')
  })

  test('Should generate params correct boolean(false) key-value', () => {
    const input = [['key', false]] as const

    const result = searchCriteria(input)

    expect(result).toBe('key=false')
  })

  test('Should generate params correct number key-value', () => {
    const input = [['key', 7]] as const

    const result = searchCriteria(input)

    expect(result).toBe('key=7')
  })

  test('Should generate string params with multiple key-values', () => {
    const input = [
      ['key1', 'value'],
      ['key2', 777],
      ['key3', false],
    ] as const

    const result = searchCriteria(input)

    expect(result).toBe('key1=value&key2=777&key3=false')
  })

  test('Should capture the last element with same key', () => {
    const input = [
      ['key', 'value1'],
      ['key', 'value2'],
    ] as const

    const result = searchCriteria(input)

    expect(result).toBe('key=value2')
  })
})

describe('SearchCriteria validation', () => {
  test('Should return undefined with empty input', () => {
    expect(searchCriteria()).toBe(undefined)
  })

  test("Shouldn't accept undefined for key", () => {
    const input = [[undefined, 'value1']]

    //@ts-expect-error
    const result = searchCriteria(input)

    expect(result).toBe(undefined)
    // 'SearchCriteria keys must have a type of string, got undefined instead',
  })

  test("Shouldn't accept number for key", () => {
    const input = [[2, 'value1']]

    //@ts-expect-error
    const result = searchCriteria(input)

    expect(result).toBe(undefined)
    // 'SearchCriteria keys must have a type of string, got number instead',
  })

  test("Shouldn't accept object for key", () => {
    const input = [[{}, 'value1']]

    //@ts-expect-error
    const result = searchCriteria(input)

    expect(result).toBe(undefined)
    // 'SearchCriteria keys must have a type of string, got object instead',
  })

  test("Shouldn't accept array for key", () => {
    const input = [[[], 'value1']]

    //@ts-expect-error
    const result = searchCriteria(input)

    expect(result).toBe(undefined)
    // 'SearchCriteria keys must have a type of string, got Array instead',
  })

  test("Shouldn't accept null for key", () => {
    const input = [[null, 'value1']]

    //@ts-expect-error
    const result = searchCriteria(input)

    expect(result).toBe(undefined)
    // 'SearchCriteria keys must have a type of string, got null instead',
  })

  test("Shouldn't accept undefined for value", () => {
    const input = [['key']]

    //@ts-expect-error
    const result = searchCriteria(input)

    expect(result).toBe(undefined)
  })
})
