import { CONDITIONS } from '@/constants'
import type { BaseValue, ILogger, TResult } from '@/types'
import {
  encodeSearchParam,
  isBaseValue,
  isNonEmptyString,
  typeName,
} from '@/utils'

export type TCondition = (typeof CONDITIONS)[keyof typeof CONDITIONS]

export type TSearchValue = BaseValue | null | undefined
type BetweenTuple<T> = [T, T]

export type TSearchIn = readonly [
  string,
  (string | number)[],
  Extract<TCondition, 'in'>,
]

export type TSearchBetween = readonly [
  string,
  BetweenTuple<string> | BetweenTuple<number>,
  Extract<TCondition, 'between'>,
]

export type TSearchEqual = readonly [string, TSearchValue]

export type TSearchRegular = readonly [
  string,
  TSearchValue,
  Exclude<TCondition, 'in' | 'between'> | undefined,
]

export type TSearchItem =
  | TSearchRegular
  | TSearchIn
  | TSearchBetween
  | TSearchEqual

export type TSearch = readonly TSearchItem[]

type TSearchOptions = { defaultCondition?: TCondition; logger?: ILogger }

export type TSearchResult = {
  search: TResult | undefined
  searchFields: TResult | undefined
}

const EMPTY_RESULT = { search: undefined, searchFields: undefined } as const

export function search(
  arg: TSearch = [],
  options: TSearchOptions = {},
): TSearchResult {
  const log = options.logger ?? console
  if (!Array.isArray(arg as TSearch)) {
    log?.error(
      `Search: keys must have a type of array, got ${typeName(arg)} instead`,
    )
    return EMPTY_RESULT
  }

  if (!arg.length) {
    log?.info('Search: no values given')
    return EMPTY_RESULT
  }

  const filteredValues = arg.reduce<[string, [BaseValue, TCondition]][]>(
    (result, item, index) => {
      if (!Array.isArray(item as TSearch[number])) {
        log?.warn(
          `Search: must have a type of array, got ${typeName(item)} instead`,
        )
        return result
      }

      if (item.length < 2) {
        log?.warn(
          `Search: must have a key-value array, but got length ${item.length} at index ${index} instead`,
        )
        return result
      }

      const key = item[0]
      if (!isNonEmptyString(key)) {
        log?.warn(
          `Search: must have keys as non-empty strings, but got ${typeName(key)} at index ${index} instead`,
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
          log?.warn(
            `Search: ignoring array value because of missing condition, expected 'in' or 'between'`,
          )
          return result
        }

        if (condition !== CONDITIONS.BTW && condition !== CONDITIONS.IN) {
          log?.warn(
            `Search: ignoring array value because got an array value for condition that is not 'in' or 'between' in index ${index}`,
          )
          return result
        }

        if (condition === CONDITIONS.BTW && value.length !== 2) {
          log?.warn(
            `Search: ignoring array value because expected array with size 2 for condition 'between', but got ${value.length} instead in index ${index}`,
          )
          return result
        }
        if (!value.every((v) => isBaseValue(v))) return result
        finalValue = value.join(',')
      } else {
        if (!isBaseValue(value)) {
          log?.info(
            `Search: ignoring value because of incorrect type, expected BaseValue but got ${typeName(value)} instead`,
          )
          return result
        }
        finalValue = value
      }

      if (
        condition !== undefined &&
        !Object.values(CONDITIONS).includes(condition)
      ) {
        log?.warn(
          `Search: ignoring value for condition because it didn't match possible values, got ${value}`,
        )
        return result
      }

      result.push([
        key,
        [finalValue, condition ?? options.defaultCondition ?? CONDITIONS.EQ],
      ])

      return result
    },
    [],
  )

  if (!filteredValues.length) {
    log?.info('Search: no values remaining to parse')
    return EMPTY_RESULT
  }

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

  if (searchAndFields.search.length === 0) return EMPTY_RESULT

  const searchResult = searchAndFields.search.join(';')
  const fieldsResult = searchAndFields.fields.join(';')
  return {
    search: { raw: searchResult, encoded: encodeSearchParam(searchResult) },
    searchFields: {
      raw: fieldsResult,
      encoded: encodeSearchParam(fieldsResult),
    },
  }
}
