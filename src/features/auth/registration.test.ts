import { afterEach, expect, it, vi } from 'vitest'
import { registrationEmailError } from './registration'

afterEach(() => vi.unstubAllGlobals())

it('checks an existing email without sending any password', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ exists: true })))
  vi.stubGlobal('fetch', fetchMock)
  expect(await registrationEmailError(' existing@example.org ')).toBe('authEmailExists')
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'existing@example.org' })
})

it('allows a new email and blocks registration if the check is unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ exists: false })))
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(new Response('', { status: 429 })))
  expect(await registrationEmailError('new@example.org')).toBeNull()
  expect(await registrationEmailError('new@example.org')).toBe('authConnectionError')
  expect(await registrationEmailError('new@example.org')).toBe('authRateLimit')
})
