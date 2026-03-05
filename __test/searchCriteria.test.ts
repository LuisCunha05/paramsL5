import { beforeEach, describe, expect, test } from 'vitest'
import { SearchCriteria } from '@/searchCriteria'

describe('SearchCriteria', () => {
  let searchCriteria: SearchCriteria

  beforeEach(() => {
    searchCriteria = new SearchCriteria()
  })

  test('Should add a non-existing parameter', () => {
    searchCriteria.add('key', 'value')

    expect(searchCriteria.get().has('key')).toBe(true)
  })

  test('Should alter an existing parameter', () => {
    searchCriteria.add('key', 'value1')
    searchCriteria.add('key', 'value2')

    expect(searchCriteria.get().get('key')).toBe('value2')
  })

  test("Shouldn't accept wrong type for key", () => {
    //@ts-expect-error
    expect(() => searchCriteria.add(undefined, 'value1')).toThrow(
      'SearchCriteria keys must have a type of string, got undefined instead',
    )
    //@ts-expect-error
    expect(() => searchCriteria.add(2, 'value1')).toThrow(
      'SearchCriteria keys must have a type of string, got number instead',
    )
    //@ts-expect-error
    expect(() => searchCriteria.add({}, 'value1')).toThrow(
      'SearchCriteria keys must have a type of string, got object instead',
    )
    //@ts-expect-error
    expect(() => searchCriteria.add([], 'value1')).toThrow(
      'SearchCriteria keys must have a type of string, got Array instead',
    )
    //@ts-expect-error
    expect(() => searchCriteria.add(null, 'value1')).toThrow(
      'SearchCriteria keys must have a type of string, got null instead',
    )
  })

  test("Shouldn't add an undefined value", () => {
    searchCriteria.add('key')

    expect(searchCriteria.get().has('key')).toBe(false)
  })

  test('Should generate empty string params with empty state', () => {
    expect(searchCriteria.toParams()).toBe('')
  })

  test('Should generate string params with single key-value', () => {
    searchCriteria.add('key', 'value')

    expect(searchCriteria.toParams()).toBe('key=value')
  })

  test('Should generate string params with multiple key-values', () => {
    searchCriteria.add('key1', 'value1')
    searchCriteria.add('key2', 'value2')
    searchCriteria.add('key3', 'value3')

    expect(searchCriteria.toParams()).toBe(
      'key1=value1&key2=value2&key3=value3',
    )
  })
})
