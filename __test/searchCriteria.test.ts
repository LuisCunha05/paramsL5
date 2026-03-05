import { describe, expect, test } from 'vitest'
import { searchCriteria } from '@/searchCriteria'

describe('SearchCriteria', () => {
  test('Should capture the last element with same key', () => {
    const input = [
      ['key', 'value1'],
      ['key', 'value2'],
    ]

    //@ts-expect-error
    expect(searchCriteria(input)).toBe('key=value2')
  })

  // test("Shouldn't accept wrong type for key", () => {
  //   //@ts-expect-error
  //   expect(() => searchCriteria.add(undefined, 'value1')).toThrow(
  //     'SearchCriteria keys must have a type of string, got undefined instead',
  //   )
  //   //@ts-expect-error
  //   expect(() => searchCriteria.add(2, 'value1')).toThrow(
  //     'SearchCriteria keys must have a type of string, got number instead',
  //   )
  //   //@ts-expect-error
  //   expect(() => searchCriteria.add({}, 'value1')).toThrow(
  //     'SearchCriteria keys must have a type of string, got object instead',
  //   )
  //   //@ts-expect-error
  //   expect(() => searchCriteria.add([], 'value1')).toThrow(
  //     'SearchCriteria keys must have a type of string, got Array instead',
  //   )
  //   //@ts-expect-error
  //   expect(() => searchCriteria.add(null, 'value1')).toThrow(
  //     'SearchCriteria keys must have a type of string, got null instead',
  //   )
  // })

  test("Shouldn't add an undefined value", () => {
    const input = [['key']]

    //@ts-expect-error
    const params = searchCriteria(input)

    expect(params).toBe(undefined)
  })

  test('Should generate empty string params with empty state', () => {
    expect(searchCriteria()).toBe(undefined)
  })

  test('Should generate string params with single key-value', () => {
    const input = [['key', 'value'] as const]

    expect(searchCriteria(input)).toBe('key=value')
  })

  test('Should generate string params with multiple key-values', () => {
    const input = [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]

    //@ts-expect-error
    const params = searchCriteria(input)

    expect(params).toBe('key1=value1&key2=value2&key3=value3')
  })
})
