import { LOG_LEVEL } from "./constants";
import type { ILogger } from "./types";

type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const LOGGER_PREFIX = "[ParamsL5]";

type LoggerArgs = {
  logger?: ILogger;
  logLevel?: LogLevel;
};

export function Logger({ logger, logLevel }: LoggerArgs): ILogger {
  const log: ILogger = logger ?? {
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  const level = logLevel ?? LOG_LEVEL.NONE;

  return {
    info: (...args: unknown[]) => {
      if (level >= LOG_LEVEL.INFO) log.info(LOGGER_PREFIX, ...args);
    },
    warn: (...args: unknown[]) => {
      if (level >= LOG_LEVEL.WARN) log.warn(LOGGER_PREFIX, ...args);
    },
    error: (...args: unknown[]) => {
      if (level >= LOG_LEVEL.ERROR) log.error(LOGGER_PREFIX, ...args);
    },
  };
}
