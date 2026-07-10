import type { ILogger } from '@/types'
import { isNumber, typeName } from '@/utils'

export type TPage = number

export type TPageOptions = {
  logger?: ILogger
}

export function page(
  arg?: TPage,
  options: TPageOptions = {},
): string | undefined {
  const log = options.logger ?? console

  if (arg === undefined) {
    log?.info('Page: no value given')
    return
  }

  if (!isInputValid(arg)) {
    log?.error(`Page: must be a positive integer, got ${typeName(arg)} instead`)
    return
  }

  return String(arg)
}

function predicate(value: number) {
  return Number.isInteger(value) && value > 0
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate)
}
