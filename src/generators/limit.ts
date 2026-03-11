import { isNumber, typeName } from '@/utils'

export type TLimit = number

export function limit(arg?: TLimit) {
  if (!isInputValid(arg)) {
    console.error(
      `Limit must be a positive integer or zero, got ${typeName(arg)} instead`,
    )
    return
  }

  const params = new URLSearchParams()
  params.set('limit', String(arg))

  return params.toString()
}

function predicate(value: number) {
  return Number.isInteger(value) && value >= 0
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate)
}
