import { LOG_LEVEL } from './constants'
import type { ILogger } from './types'

type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL]

export function Logger(logger?: ILogger, logLevel?: LogLevel): ILogger {
  const log: ILogger = {
    info: logger?.info ?? console.info,
    warn: logger?.warn ?? console.warn,
    error: logger?.error ?? console.error,
  }

  const level = logLevel ?? LOG_LEVEL.NONE

  return {
    info: (...args: unknown[]) => {
      if (level >= LOG_LEVEL.INFO) log.info(args)
    },
    warn: (...args: unknown[]) => {
      if (level >= LOG_LEVEL.WARN) log.warn(args)
    },
    error: (...args: unknown[]) => {
      if (level >= LOG_LEVEL.ERROR) log.error(args)
    },
  }
}
