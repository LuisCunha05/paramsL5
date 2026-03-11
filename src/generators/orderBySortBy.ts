import { SORT_BY } from '@/constants'
import { isNonEmptyString, typeName } from '@/utils'

export type TSortBy = (typeof SORT_BY)[keyof typeof SORT_BY]

export type TOrderBySortByValue = readonly [string, TSortBy?]
export type TOrderBySortByDefault = readonly [string]
export type TOrderBySortByArguments =
  | TOrderBySortByValue
  | TOrderBySortByDefault

type TOrderBySortByOptions = { defaultSortBy?: TSortBy }

export type TOrderBySortBy = readonly TOrderBySortByArguments[]

export function orderBySortBy(
  arg: TOrderBySortBy = [],
  options: TOrderBySortByOptions = {},
): string | undefined {
  if (!Array.isArray(arg as TOrderBySortBy)) {
    console.error(
      `OrderBySortBy keys must have a type of array, got ${typeName(arg)} instead`,
    )
    return
  }

  if (!arg.length) return

  const filteredValues = arg.reduce((result, item, index) => {
    if (!Array.isArray(item as TOrderBySortByArguments)) {
      console.error(
        `OrderBySortBy must have a type of array, got ${typeName(item)} instead`,
      )
      return result
    }

    if (item.length < 1 || item.length > 2) {
      console.error(
        `OrderBySortBy must have a key-value array, but got length ${item.length} at index ${index} instead`,
      )
      return result
    }

    const [key, sortBy] = item

    if (!isNonEmptyString(key)) {
      console.error(
        `OrderBySortBy must have keys as non-empty strings, but got ${typeName(key)} at index ${index} instead`,
      )
      return result
    }

    if (
      typeof sortBy !== 'undefined' &&
      !Object.values(SORT_BY).includes(sortBy)
    ) {
      console.error(
        `OrderBySortBy must have a valid SORT_BY value, but got ${sortBy} at index ${index} instead`,
      )
      return result
    }

    result.set(key, sortBy ?? options?.defaultSortBy ?? SORT_BY.ASC)

    return result
  }, new Map<string, TSortBy>())

  if (!filteredValues.size) return

  const deduplicatedValues = Array.from(filteredValues)

  const orderBySortedBy = deduplicatedValues.reduce(
    (result, [key, value]) => {
      result.orderBy.push(key)
      result.sortedBy.push(value)
      return result
    },
    { orderBy: [] as string[], sortedBy: [] as TSortBy[] },
  )

  const params = new URLSearchParams()
  params.set('orderBy', orderBySortedBy.orderBy.join(';'))
  params.set('sortedBy', orderBySortedBy.sortedBy.join(';'))

  return params.toString()
}
