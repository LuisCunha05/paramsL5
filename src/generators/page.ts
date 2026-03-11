import { isNumber, typeName } from '@/utils'

export type TPage = number

export function page(arg?: TPage) {
  if (!arg || !isInputValid(arg)) {
    console.error(
      `Page must be a positive integer, got ${typeName(arg)} instead`,
    )
    return
  }
  const params = new URLSearchParams()
  params.set('page', String(arg))

  return params.toString()
}

function predicate(value: number) {
  return Number.isInteger(value) && value > 0
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate)
}
