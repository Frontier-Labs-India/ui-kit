import { describe, it, expect } from 'vitest'

describe('pinned default locale (loaded by tests/setup.ts)', () => {
  const t = new Date(Date.UTC(2026, 0, 15, 12, 5))
  it('undefined locale formats as en-US', () => {
    expect(t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })).toBe('12:05 PM')
    expect((1234.5).toLocaleString()).toBe('1,234.5')
    expect(new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' }).format(t)).toBe('Jan')
  })
  it('an explicit locale is still honoured', () => {
    expect(t.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })).toBe('12:05')
    expect((1234.5).toLocaleString('de-DE')).toBe('1.234,5')
  })
})
