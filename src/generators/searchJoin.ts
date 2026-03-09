import { SEARCH_JOIN } from '@/constants'
import { isNonEmptyString, typeName } from '@/utils'

export type TSearchJoin = (typeof SEARCH_JOIN)[keyof typeof SEARCH_JOIN]

export function searchJoin(arg?: TSearchJoin) {
  if (!arg) return

  if (!isNonEmptyString(arg)) {
    console.error(`SearchJoin must be an string, got ${typeName(arg)} instead`)
    return
  }

  if (!(arg === SEARCH_JOIN.AND || arg === SEARCH_JOIN.OR)) {
    console.error(
      `SearchJoin must be either "${SEARCH_JOIN.AND}" or "${SEARCH_JOIN.OR}"`,
    )
    return
  }

  const params = new URLSearchParams()
  params.set('searchJoin', arg)

  return params.toString()
}
