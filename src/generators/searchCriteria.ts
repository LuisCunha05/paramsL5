import type { BaseValue, ILogger, TResult } from '@/types'
import {
  encodeSearchParam,
  isBaseValue,
  isNonEmptyString,
  typeName,
} from '@/utils'

export type TCriteriaValue = BaseValue | null | undefined
export type TSearchCriteria = readonly (readonly [string, TCriteriaValue])[]

export type TSearchCriteriaOptions = {
  logger?: ILogger
}

export function searchCriteria(
  arg: TSearchCriteria = [],
  options: TSearchCriteriaOptions = {},
): TResult | undefined {
  const log = options.logger
  if (!Array.isArray(arg as TSearchCriteria)) {
    log?.error(
      `SearchCriteria keys must have a type of array, got ${typeName(arg)} instead`,
    )
    return
  }

  if (!arg.length) return

  const filteredValues = arg.filter((item, index) => {
    if (!Array.isArray(item)) {
      log?.error(
        `SearchCriteria must have a type of array, got ${typeName(item)} instead`,
      )
      return false
    }

    if (item.length !== 2) {
      log?.error(
        `SearchCriteria must have a key-value array, but got length ${item.length} at index ${index} instead`,
      )
      return false
    }

    if (!isNonEmptyString(item[0])) {
      log?.error(
        `SearchCriteria must have keys as non-empty strings, but got ${typeName(item[0])} at index ${index} instead`,
      )
      return false
    }

    if (!isBaseValue(item[1])) return false

    return true
  })

  if (!filteredValues.length) return

  const deduplicatedValues = Array.from(
    new Map(filteredValues as [string, BaseValue][]),
  )

  const result: TResult = {
    raw: '',
    encoded: '',
  }

  deduplicatedValues.forEach(([key, value]) => {
    result.raw += `&${key}=${value}`
    result.encoded += `&${encodeSearchParam(key)}=${encodeSearchParam(String(value))}`
  })

  result.raw = result.raw.substring(1)
  result.encoded = result.encoded.substring(1)

  return result
}
