import { LOG_LEVEL } from './constants';
import type { ILogger } from './types';

type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const LOGGER_PREFIX = '[ParamsL5]';

interface LoggerArgs {
  logger?: ILogger;
  logLevel?: LogLevel;
}

export function Logger({ logger, logLevel }: Readonly<LoggerArgs>): ILogger {
  const log: ILogger = logger ?? {
    error: console.error,
    info: console.info,
    warn: console.warn,
  };

  const level = logLevel ?? LOG_LEVEL.NONE;

  return {
    error: (...args: readonly unknown[]) => {
      if (level >= LOG_LEVEL.ERROR) {
        log.error(LOGGER_PREFIX, ...args);
      }
    },
    info: (...args: readonly unknown[]) => {
      if (level >= LOG_LEVEL.INFO) {
        log.info(LOGGER_PREFIX, ...args);
      }
    },
    warn: (...args: readonly unknown[]) => {
      if (level >= LOG_LEVEL.WARN) {
        log.warn(LOGGER_PREFIX, ...args);
      }
    },
  };
}
