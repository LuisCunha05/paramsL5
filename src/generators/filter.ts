import type { ILogger, TResult } from '@/types'
import { encodeSearchParam, isNonEmptyString, typeName } from '@/utils'

export type TFilter = Array<string>

export type TFilterOptions = {
  logger?: ILogger
}

export function filter(
  arg: TFilter = [],
  options: TFilterOptions = {},
): TResult | undefined {
  const log = options.logger
  if (!Array.isArray(arg)) {
    log?.error(
      `Argument of filter must be a array, got ${typeName(arg)} instead`,
    )
    return
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.warn(`Include value must be a string, got ${typeName(arg)} instead`)
      return false
    }
    return true
  })

  if (!filteredValues.length) return

  const uniqueValues = Array.from(new Set(filteredValues))

  if (!uniqueValues.length) return

  return {
    raw: uniqueValues.join(';'),
    encoded: encodeSearchParam(uniqueValues.join(';')),
  }
}
