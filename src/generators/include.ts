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
    log?.error(`Argument must be a array, got ${typeName(arg)} instead`)
    return
  }

  const filteredValues = arg.reduce(
    (result, item) => {
      if (!isNonEmptyString(item)) {
        log?.warn(
          `Include value must be a string, got ${typeName(arg)} instead`,
        )
        return result
      }

      result.push(item)
      return result
    },
    [] as Array<string>,
  )
  const uniqueValues = Array.from(new Set(filteredValues))

  if (!uniqueValues.length) return

  const result = uniqueValues.join(',')

  return {
    raw: result,
    encoded: encodeSearchParam(uniqueValues.join(',')),
  }
}
