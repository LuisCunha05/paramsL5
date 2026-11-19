import type { TLogger } from '#/types';

export interface LogLevel {
  readonly error?: boolean;
  readonly info?: boolean;
  readonly warn?: boolean;
}

export const LOGGER_PREFIX = '[ParamsL5]:';

interface LoggerArgs {
  readonly logger?: TLogger;
  readonly logLevel?: LogLevel;
}

export function logger({
  logger: loggerValue,
  logLevel,
}: LoggerArgs = {}): TLogger {
  const log: TLogger = loggerValue ?? {
    error: console.error,
    info: console.info,
    warn: console.warn,
  };

  const { error = false, warn = false, info = false } = logLevel ?? {};

  return {
    error: (...args: readonly unknown[]) => {
      if (error) {
        log.error(LOGGER_PREFIX, ...args);
      }
    },
    info: (...args: readonly unknown[]) => {
      if (info) {
        log.info(LOGGER_PREFIX, ...args);
      }
    },
    warn: (...args: readonly unknown[]) => {
      if (warn) {
        log.warn(LOGGER_PREFIX, ...args);
      }
    },
  };
}
