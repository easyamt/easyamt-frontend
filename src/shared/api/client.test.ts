import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('apiRequest', () => {
  it('sends bearer auth without forcing JSON on multipart uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'one' }), { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const body = new FormData()
    body.append('file', new Blob(['pdf']), 'letter.pdf')

    await apiRequest('/v1/documents/upload', 'test-token', { method: 'POST', body })

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('reads RFC 9457 codes and handles an empty deletion response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'quota_exceeded', detail: 'Limit reached' }), { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/v1/documents/upload', 'token')).rejects.toMatchObject({ status: 429, code: 'quota_exceeded' } satisfies Partial<ApiError>)
    await expect(apiRequest('/v1/documents/one', 'token', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
