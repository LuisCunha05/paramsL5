import type { ILogger } from './types';

export interface LogLevel {
  error?: boolean;
  info?: boolean;
  warn?: boolean;
}

export const LOGGER_PREFIX = '[ParamsL5]';

interface LoggerArgs {
  readonly logger?: ILogger;
  readonly logLevel?: LogLevel;
}

export function logger({ logger, logLevel }: LoggerArgs = {}): ILogger {
  const log: ILogger = logger ?? {
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

export const defaultLogger = logger({ logLevel: { error: true } });
