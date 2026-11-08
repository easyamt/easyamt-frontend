import { afterEach, describe, expect, it, vi } from 'vitest'
import { askDocument, chatHistory } from './chatApi'
import type { ChatTurn } from './chatApi'

afterEach(() => vi.unstubAllGlobals())

describe('document chat contract', () => {
  it('sends only the question and bounded history to the owned document with bearer authentication', async () => {
    const reply = { scope: 'document', answer: 'A reply', citations: [{ page: 1, quote: 'A quote' }], grounded: true, needs_clarification: false, suggested_followups: [] }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(reply)))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    await expect(askDocument('test-token', 'doc/id', ' Question? ', [{ role: 'user', content: 'Before' }], 'es-CO', controller.signal)).resolves.toEqual(reply)
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.pathname).toBe('/v1/documents/doc%2Fid/chat')
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer test-token')
    expect(init.method).toBe('POST')
    expect(init.signal).toBe(controller.signal)
    expect(JSON.parse(init.body as string)).toEqual({ message: 'Question?', history: [{ role: 'user', content: 'Before' }], output_language: 'es' })
  })
  it('bounds history without splitting Unicode or mutating the displayed conversation', () => {
    const history: ChatTurn[] = Array.from({ length: 12 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: '🐱'.repeat(2001) }))
    const bounded = chatHistory(history)
    expect(bounded).toHaveLength(10)
    expect(Array.from(bounded[0].content)).toHaveLength(2000)
    expect(Array.from(history[0].content)).toHaveLength(2001)
  })
  it('uses English for unsupported chat languages and exposes typed quota errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'quota_exceeded' }), { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(askDocument('token', 'one', 'Question', [], 'de')).rejects.toMatchObject({ status: 429, code: 'quota_exceeded' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).output_language).toBe('en')
  })
})
