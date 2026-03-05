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
  BTW: 'between',
} as const)

export type TCondition = (typeof Condition)[keyof typeof Condition]

export type TSearchValue = BaseValue | null | undefined

export type TSearchIn = readonly (readonly [
  string,
  (string | number)[],
  Extract<TCondition, 'in'>,
])[]

type BitweenTuple<T> = [T, T]

export type TSearchIBitween = readonly (readonly [
  string,
  BitweenTuple<string> | BitweenTuple<number>,
  Extract<TCondition, 'between'>,
])[]

export type TSearchEqual = readonly (readonly [string, TSearchValue])[]

export type TSearchRegular = readonly (readonly [
  string,
  TSearchValue,
  Exclude<TCondition, 'in' | 'between'> | undefined,
])[]

export type TSearch =
  | TSearchRegular
  | TSearchIn
  | TSearchIBitween
  | TSearchEqual

export function search(arg?: TSearchRegular): string | undefined
export function search(arg?: TSearchIn): string | undefined
export function search(arg?: TSearchIBitween): string | undefined
export function search(arg?: TSearchEqual): string | undefined
export function search(arg: TSearch = []) {
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
        if (!value.every((v) => isBaseValue(v))) return result
        finalValue = value.join(',')
      } else {
        if (!isBaseValue(value)) return result
        finalValue = value
      }

      if (
        condition !== undefined &&
        !Object.values(Condition).includes(condition)
      ) {
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
