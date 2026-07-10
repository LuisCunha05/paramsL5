import { SEARCH_JOIN } from '@/constants'
import type { ILogger } from '@/types'
import { isNonEmptyString, typeName } from '@/utils'

export type TSearchJoin = (typeof SEARCH_JOIN)[keyof typeof SEARCH_JOIN]
export type TSearchJoinOptions = {
  logger?: ILogger
}

export function searchJoin(
  arg?: TSearchJoin,
  options: TSearchJoinOptions = {},
): string | undefined {
  const log = options.logger ?? console
  if (arg === undefined) {
    log?.info('SearchJoin: no value given')
    return
  }

  if (!isNonEmptyString(arg)) {
    log?.error(`SearchJoin: must be a string, got ${typeName(arg)} instead`)
    return
  }

  if (!(arg === SEARCH_JOIN.AND || arg === SEARCH_JOIN.OR)) {
    log?.error(
      `SearchJoin: must be either "${SEARCH_JOIN.AND}" or "${SEARCH_JOIN.OR}", got "${arg}" instead`,
    )
    return
  }

  return arg
}
