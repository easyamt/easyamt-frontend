import { describe, expect, it, vi } from 'vitest'
import { pollingInterval } from './useDocumentStatus'

describe('pollingInterval', () => {
  it('slows down with age and stops at terminal states', () => {
    vi.setSystemTime(new Date('2026-11-08T12:00:00Z'))
    expect(pollingInterval('2026-11-08T11:59:55Z', 'processing')).toBe(1000)
    expect(pollingInterval('2026-11-08T11:59:40Z', 'processing')).toBe(2000)
    expect(pollingInterval('2026-11-08T11:59:00Z', 'processing')).toBe(3000)
    expect(pollingInterval('2026-11-08T11:59:00Z', 'completed')).toBe(false)
    expect(pollingInterval('2026-11-08T11:59:00Z', 'failed')).toBe(false)
    vi.useRealTimers()
  })
})
