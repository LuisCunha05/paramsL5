import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { limit } from '@/limit'

const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

describe('Limit', () => {
  let result: string | undefined

  beforeEach(() => {
    result = undefined
  })

  afterEach(() => {
    error.mockReset()
  })

  test('Should set limit to a parameter', () => {
    result = limit(7)

    expect(result).toBe('limit=7')
  })

  test('Should have a default value', () => {
    expect(limit()).toBe('limit=10')
  })

  test('Should warn for non-number arguments', () => {
    //@ts-expect-error
    limit(null)
    //@ts-expect-error
    limit({})
    //@ts-expect-error
    limit([])

    expect(error).toHaveBeenCalledTimes(3)
  })

  test('Should warm for negative numbers', () => {
    limit(-10)
    expect(error).toHaveBeenCalled()
  })

  test('Should warn with specific message', () => {
    limit(-10)
    expect(error).toHaveBeenCalledWith(
      'Limit must be a positive integer or zero, got number instead',
    )
  })
})
