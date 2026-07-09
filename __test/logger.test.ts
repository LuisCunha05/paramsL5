import { afterEach, describe, expect, test, vi } from 'vitest'
import { LOG_LEVEL } from '@/constants'
import { LOGGER_PREFIX, Logger } from '@/logger'

afterEach(() => {
  vi.clearAllMocks()
})

const mocks = () => {
  const info = vi.fn()
  const warn = vi.fn()
  const error = vi.fn()
  const loggerImp = { info, warn, error }
  return { info, warn, error, loggerImp }
}

describe('Logger function', () => {
  test("shouldn't log with level NONE", () => {
    const { error, info, loggerImp, warn } = mocks()

    const logger = Logger({ logger: loggerImp, logLevel: LOG_LEVEL.NONE })

    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(info).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  test('should log info with level INFO', () => {
    const { error, info, loggerImp, warn } = mocks()

    const logger = Logger({ logger: loggerImp, logLevel: LOG_LEVEL.INFO })

    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(info).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'info')
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  test('should log info and warn with level WARN', () => {
    const { error, info, loggerImp, warn } = mocks()

    const logger = Logger({ logger: loggerImp, logLevel: LOG_LEVEL.WARN })

    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(info).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'info')
    expect(warn).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'warn')
    expect(error).not.toHaveBeenCalled()
  })

  test('should log info, warn and error with level ERROR', () => {
    const { error, info, loggerImp, warn } = mocks()

    const logger = Logger({ logger: loggerImp, logLevel: LOG_LEVEL.ERROR })

    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(info).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'info')
    expect(warn).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'warn')
    expect(error).toHaveBeenCalledExactlyOnceWith(LOGGER_PREFIX, 'error')
  })
})
