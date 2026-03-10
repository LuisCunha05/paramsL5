import { isNonEmptyString, typeName } from '@/utils'

export type TInclude = Array<string>

export function include(arg: TInclude = []) {
  if (!Array.isArray(arg)) {
    console.error(`Argument must be a array, got ${typeName(arg)} instead`)
    return
  }

  const filteredValues = arg.reduce(
    (result, item) => {
      if (!isNonEmptyString(item)) {
        console.error(
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

  const params = new URLSearchParams()
  params.set('include', uniqueValues.join(','))

  return params.toString()
}
