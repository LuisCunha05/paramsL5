import { SORT_BY } from '@/constants'
import { isNonEmptyString, typeName } from '@/utils'

export type TSortBy = (typeof SORT_BY)[keyof typeof SORT_BY]

export type TOrderBySortByValue = [string, TSortBy]
export type TOrderBySortBy = readonly TOrderBySortByValue[]

export function orderBySortBy(arg: TOrderBySortBy = []) {
  if (!Array.isArray(arg)) {
    console.error(
      `OrderBySortBy keys must have a type of array, got ${typeName(arg)} instead`,
    )
    return
  }

  if (!arg.length) return

  const filteredValues = arg.filter((item, index) => {
    if (!Array.isArray(item)) {
      console.error(
        `OrderBySortBy must have a type of array, got ${typeName(item)} instead`,
      )
      return false
    }

    if (item.length !== 2) {
      console.error(
        `OrderBySortBy must have a key-value array, but got length ${item.length} at index ${index} instead`,
      )
      return false
    }

    if (!isNonEmptyString(item[0])) {
      console.error(
        `OrderBySortBy must have keys as non-empty strings, but got ${typeName(item[0])} at index ${index} instead`,
      )
      return false
    }

    if (!Object.values(SORT_BY).includes(item[1])) {
      console.error(
        `OrderBySortBy must have a valid SORT_BY value, but got ${item[1]} at index ${index} instead`,
      )
      return false
    }

    return true
  })

  if (!filteredValues.length) return

  const deduplicatedValues = Array.from(new Map(filteredValues))

  const orderBy = deduplicatedValues.map(([key]) => key).join(';')
  const sortedBy = deduplicatedValues.map(([, value]) => value).join(';')

  const params = new URLSearchParams()
  params.set('orderBy', orderBy)
  params.set('sortedBy', sortedBy)

  return params.toString()
}
