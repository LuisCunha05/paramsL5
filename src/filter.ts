import { isNonEmptyString, typeName } from '@/utils'

export type TFilter = Array<string>

export function filter(arg: TFilter) {
  if (!Array.isArray(arg)) {
    console.error(
      `Argument of filter must be a array, got ${typeName(arg)} instead`,
    )
    return
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      console.error(
        `Include value must be a string, got ${typeName(arg)} instead`,
      )
      return false
    }
    return true
  })
  const uniqueValues = new Set(filteredValues)

  const params = new URLSearchParams()
  params.set('filter', Array.from(uniqueValues).join(';'))

  return params.toString()
}
