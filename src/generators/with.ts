import { isNonEmptyString, typeName } from '@/utils'

export type TWith = Array<string>

export function withRel(arg: TWith = []) {
  if (!Array.isArray(arg)) {
    console.error(
      `Argument of withRel must be a array, got ${typeName(arg)} instead`,
    )
    return
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      console.error(
        `withRel value must be a string, got ${typeName(arg)} instead`,
      )
      return false
    }
    return true
  })
  const uniqueValues = new Set(filteredValues)

  const params = new URLSearchParams()
  params.set('with', Array.from(uniqueValues).join(';'))

  return params.toString()
}
