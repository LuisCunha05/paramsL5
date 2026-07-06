import type { ILogger, TResult } from '@/types'
import { encodeSearchParam, isNonEmptyString, typeName } from '@/utils'

export type TWith = Array<string>
export type TWithOptions = {
  logger?: ILogger
}

export function withRel(
  arg: TWith = [],
  options: TWithOptions = {},
): TResult | undefined {
  const log = options.logger
  if (!Array.isArray(arg)) {
    log?.error(
      `Argument of withRel must be a array, got ${typeName(arg)} instead`,
    )
    return
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.error(`withRel value must be a string, got ${typeName(arg)} instead`)
      return false
    }
    return true
  })

  if (!filteredValues.length) return

  const uniqueValues = Array.from(new Set(filteredValues))

  if (!uniqueValues.length) return

  const params = new URLSearchParams()
  params.set('with', uniqueValues.join(';'))

  const result = uniqueValues.join(';')

  return {
    raw: result,
    encoded: encodeSearchParam(result),
  }
}
