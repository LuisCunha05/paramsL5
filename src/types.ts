export type BaseValue = string | number | boolean

export interface ILogger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export type TResult = {
  raw: string
  encoded: string
}
