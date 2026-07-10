import type { ILogger, TResult } from '@/types'
import { encodeSearchParam, isNonEmptyString, typeName } from '@/utils'

export type TInclude = Array<string>

export type TIncludeOptions = {
  logger?: ILogger
}

export function include(
  arg: TInclude = [],
  options: TIncludeOptions = {},
): TResult | undefined {
  const log = options.logger ?? console
  if (!Array.isArray(arg)) {
    log?.error(`Include: argument must be an array, got ${typeName(arg)} instead`)
    return
  }

  if (!arg.length) {
    log?.info('Include: no values given')
    return
  }

  const filteredValues = arg.reduce(
    (result, item) => {
      if (!isNonEmptyString(item)) {
        log?.info(
          `Include: include value must be a string, got ${typeName(item)} instead`,
        )
        return result
      }

      result.push(item)
      return result
    },
    [] as Array<string>,
  )

  if (!filteredValues.length) {
    log?.info('Include: no values remaining to parse')
    return
  }

  const uniqueValues = Array.from(new Set(filteredValues))

  const result = uniqueValues.join(',')

  return {
    raw: result,
    encoded: encodeSearchParam(uniqueValues.join(',')),
  }
}
