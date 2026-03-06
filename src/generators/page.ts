import { isNumber, typeName } from '@/utils'

export type TPage = number

export function page(arg: TPage = 10) {
  let value = arg
  if (typeof arg !== 'undefined' && !isInputValid(arg)) {
    value = 10
    console.error(
      `Page must be a positive integer, got ${typeName(arg)} instead`,
    )
  }
  const params = new URLSearchParams()
  params.set('page', String(value))

  return params.toString()
}

function predicate(value: number) {
  return Number.isInteger(value) && value > 0
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate)
}
