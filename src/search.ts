import type { BaseValue } from '@/types'
import { isBaseValue, isNonEmptyString, typeName } from '@/utils'

export const Condition = Object.freeze({
  EQ: '=',
  GTE: '>=',
  LTE: '<=',
  GT: '>',
  LT: '<',
  DIFF: '!=',
  IN: 'in',
  LIKE: 'like',
  ILIKE: 'ilike',
  BTW: 'bitween',
} as const)

export type TCondition = (typeof Condition)[keyof typeof Condition]

export type TSearchValue = BaseValue | null | undefined
type BitweenTuple<T> = [T, T]

export type TSearchIn = readonly [
  string,
  (string | number)[],
  Extract<TCondition, 'in'>,
]

export type TSearchBitween = readonly [
  string,
  BitweenTuple<string> | BitweenTuple<number>,
  Extract<TCondition, 'bitween'>,
]

export type TSearchEqual = readonly [string, TSearchValue]

export type TSearchRegular = readonly [
  string,
  TSearchValue,
  Exclude<TCondition, 'in' | 'bitween'> | undefined,
]

export type TSearchItem =
  | TSearchRegular
  | TSearchIn
  | TSearchBitween
  | TSearchEqual

export type TSearch = readonly TSearchItem[]

export function search(arg: TSearch = []): string | undefined {
  if (!Array.isArray(arg as TSearch)) {
    console.error(
      `Search keys must have a type of array, got ${typeName(arg)} instead`,
    )
    return
  }

  if (!arg.length) return

  const filteredValues = arg.reduce<[string, [BaseValue, TCondition]][]>(
    (result, item, index) => {
      if (!Array.isArray(item as TSearch[number])) {
        console.error(
          `Search must have a type of array, got ${typeName(item)} instead`,
        )
        return result
      }

      if (item.length < 2) {
        console.error(
          `Search must have a key-value array, but got length ${item.length} at index ${index} instead`,
        )
        return result
      }

      const key = item[0]
      if (!isNonEmptyString(key)) {
        console.error(
          `Search must have keys as non-empty strings, but got ${typeName(key)} at index ${index} instead`,
        )
        return result
      }

      const value = item[1]
      const condition = item[2]

      if (value === null || value === undefined) return result

      let finalValue: BaseValue

      if (Array.isArray(value)) {
        if (!value.length) return result
        if (!condition) {
          console.warn(
            `Ignoring array value in Search because of missing condition, expected 'in' or 'bitween'`,
          )
          return result
        }

        if (condition !== Condition.BTW && condition !== Condition.IN) {
          console.warn(
            `Ignoring array value in Search because got an array value for condition that is not 'in' or 'bitween' in index ${index}`,
          )
          return result
        }

        if (condition === Condition.BTW && value.length !== 2) {
          console.warn(
            `Ignoring array value in Search because expected array with size 2 for condition 'bitween', but got ${value.length} instead in index ${index}`,
          )
          return result
        }
        if (!value.every((v) => isBaseValue(v))) return result
        finalValue = value.join(',')
      } else {
        if (!isBaseValue(value)) {
          console.warn(
            `Ignoring value in Search because of incorrect type, expected BaseValue but got ${typeName(value)} instead`,
          )
          return result
        }
        finalValue = value
      }

      if (
        condition !== undefined &&
        !Object.values(Condition).includes(condition)
      ) {
        console.warn(
          `Ignoring value for Condition in search because it didn't match possible values, got ${value}`,
        )
        return result
      }

      result.push([key, [finalValue, condition ?? Condition.EQ]])

      return result
    },
    [],
  )

  if (!filteredValues.length) return

  const deduplicatedValues = Array.from(new Map(filteredValues))

  const searchAndFields = deduplicatedValues.reduce(
    (result, [key, [value, condition]]) => {
      const newValue = typeof value === 'string' ? value.trim() : value

      result.search.push(`${key}:${newValue}`)
      result.fields.push(`${key}:${condition}`)

      return result
    },
    { search: [] as string[], fields: [] as string[] },
  )

  if (searchAndFields.search.length === 0) return

  const params = new URLSearchParams()
  params.set('search', searchAndFields.search.join(';'))
  params.set('searchFields', searchAndFields.fields.join(';'))

  return params.toString()
}
