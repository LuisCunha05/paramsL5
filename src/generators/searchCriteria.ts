import type { BaseValue } from '@/types'
import { isBaseValue, isNonEmptyString, typeName } from '@/utils'

export type TCriteriaValue = BaseValue | null | undefined
export type TSearchCriteria = readonly (readonly [string, TCriteriaValue])[]

export function searchCriteria(arg: TSearchCriteria = []) {
  if (!Array.isArray(arg as TSearchCriteria)) {
    console.error(
      `SearchCriteria keys must have a type of array, got ${typeName(arg)} instead`,
    )
    return
  }

  if (!arg.length) return

  const filteredValues = arg.filter((item, index) => {
    if (!Array.isArray(item)) {
      console.error(
        `SearchCriteria must have a type of array, got ${typeName(item)} instead`,
      )
      return false
    }

    if (item.length !== 2) {
      console.error(
        `SearchCriteria must have a key-value array, but got length ${item.length} at index ${index} instead`,
      )
      return false
    }

    if (!isNonEmptyString(item[0])) {
      console.error(
        `SearchCriteria must have keys as non-empty strings, but got ${typeName(item[0])} at index ${index} instead`,
      )
      return false
    }

    if (!isBaseValue(item[1])) return false

    return true
  })

  if (!filteredValues.length) return

  const deduplicatedValues = Array.from(new Map(filteredValues))

  const params = new URLSearchParams()
  deduplicatedValues.forEach(([key, value]) => {
    params.set(key, String(value))
  })

  return params.toString()
}
