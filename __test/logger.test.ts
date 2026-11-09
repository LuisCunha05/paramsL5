import { afterEach, describe, expect, test, vi } from 'vitest';

import { LOGGER_PREFIX, logger as loggerFn } from '@/logger';

afterEach(() => {
  vi.clearAllMocks();
});

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const loggerImp = { info, warn, error };

describe('Logger function', () => {
  test("shouldn't log with level NONE", () => {
    const logger = loggerFn({ logger: loggerImp });

    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  test('should log info with level INFO', () => {
    const logger = loggerFn({ logger: loggerImp, logLevel: { info: true } });

    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(info).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'info');
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  test('should log info and warn with level WARN', () => {
    const logger = loggerFn({ logger: loggerImp, logLevel: { warn: true } });

    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'warn');
    expect(error).not.toHaveBeenCalled();
  });

  test('should log error with logLevel error ', () => {
    const logger = loggerFn({ logger: loggerImp, logLevel: { error: true } });

    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'error');
  });

  test('should log all with logLevel true ', () => {
    const logger = loggerFn({
      logger: loggerImp,
      logLevel: { error: true, warn: true, info: true },
    });

    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(info).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'info');
    expect(warn).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'warn');
    expect(error).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'error');
  });
});
