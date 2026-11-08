// Development-only browser checks; no DOM/test packages or production imports.
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import PixelMascot from './PixelMascot'
import MascotPanel from './MascotPanel'
import DocumentCompanion from './DocumentCompanion'
import { MASCOT_SHEET } from './mascotStates'
import type { MascotState } from './mascotStates'
import i18n from '../../shared/i18n'

export async function runChecks() {
  const results: string[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const originalFetch = window.fetch
  const originalInterval = window.setInterval
  const originalClear = window.clearInterval
  const originalMatchMedia = window.matchMedia
  const savedPreference = sessionStorage.getItem('easyamt-mascot-hidden')
  const originalLanguage = i18n.language
  let now = 0
  let sequence = 0
  let reduced = false
  const listeners = new Set<() => void>()
  const timers = new Map<number, { callback: () => void; delay: number; next: number }>()
  window.setInterval = (handler: TimerHandler, timeout = 0) => {
    if (typeof handler !== 'function') throw new Error('Only function timers are supported')
    const id = ++sequence
    timers.set(id, { callback: () => handler(), delay: timeout, next: now + timeout })
    return id
  }
  window.clearInterval = (id) => { if (id !== undefined) timers.delete(id) }
  window.matchMedia = (query) => {
    if (query !== '(prefers-reduced-motion: reduce)') return originalMatchMedia.call(window, query)
    return {
      matches: reduced, media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    } as unknown as MediaQueryList
  }
  function assert(condition: unknown, name: string) {
    if (!condition) throw new Error(name)
    results.push(name)
  }
  async function tick(ms: number) {
    await act(async () => {
      const end = now + ms
      while (true) {
        const next = [...timers.entries()].filter(([, timer]) => timer.next <= end).sort((a, b) => a[1].next - b[1].next)[0]
        if (!next) break
        now = next[1].next
        next[1].next += next[1].delay
        next[1].callback()
      }
      now = end
    })
  }
  const config = { ...MASCOT_SHEET, rows: 3, clips: {
    ...MASCOT_SHEET.clips,
    reading: { row: 1, frames: 3, fps: 10, loop: true },
    celebrating: { row: 2, frames: 2, fps: 10, loop: false, returnTo: 'idle' as const },
  } }
  const sprite = () => host.querySelector<HTMLElement>('[role="img"]')!
  try {
    await act(async () => root.render(<PixelMascot state="reading" config={config} scale={2} label="Cat" flip />))
    assert(sprite().style.backgroundSize === '640px 192px', 'background size uses sheet geometry')
    assert(sprite().style.backgroundPosition === '0px -64px', 'initial frame and row offsets')
    assert(sprite().style.transform === 'scaleX(-1)', 'flip mirrors the sprite')
    await tick(100)
    assert(sprite().style.backgroundPosition === '-64px -64px', 'timer advances the frame')
    await tick(200)
    assert(sprite().style.backgroundPosition === '0px -64px', 'loop wraps to the first frame')
    await act(async () => { reduced = true; listeners.forEach((listener) => listener()) })
    await tick(1000)
    assert(sprite().style.backgroundPosition === '0px -64px' && timers.size === 0, 'reduced motion changes pause on frame zero')
    await act(async () => { reduced = false; listeners.forEach((listener) => listener()) })
    await tick(100)
    assert(sprite().style.backgroundPosition === '-64px -64px', 'motion resumes when preference changes')
    await act(async () => root.render(<PixelMascot state="celebrating" config={config} scale={2} label="Cat" />))
    assert(sprite().style.backgroundPosition === '0px -128px', 'clip changes restart at zero')
    await tick(100)
    assert(sprite().style.backgroundPosition === '-64px -128px', 'non-looping final frame is displayed')
    await tick(100)
    assert(sprite().style.backgroundPosition === '0px 0px', 'celebration returns to idle')
    await act(async () => root.render(<PixelMascot state="reading" config={config} scale={2} />))
    assert(host.firstElementChild?.getAttribute('aria-hidden') === 'true', 'unlabeled sprite is decorative')
    await act(async () => root.render(null))
    assert(timers.size === 0 && listeners.size === 0, 'unmount clears timers and media listeners')

    await act(async () => { reduced = true })
    await act(async () => root.render(<PixelMascot state="reading" config={config} scale={2} label="Cat" />))
    await tick(1000)
    assert(sprite().style.backgroundPosition === '0px -64px' && timers.size === 0, 'initial reduced motion stays on frame zero')
    await act(async () => root.render(null))
    await act(async () => { reduced = false })
    sessionStorage.removeItem('easyamt-mascot-hidden')
    const states = Object.keys(MASCOT_SHEET.clips) as MascotState[]
    for (const language of ['en', 'es', 'de']) {
      await act(async () => { await i18n.changeLanguage(language) })
      for (const state of states) {
        await act(async () => root.render(<MascotPanel state={state} />))
        const bubble = host.querySelector('[aria-live="polite"]')
        assert(typeof i18n.getResource(language, 'translation', "mascot." + state) === 'string' && bubble?.textContent === i18n.t(`mascot.${state}`) && bubble.textContent !== `mascot.${state}`, `${language}: ${state} bubble`)
      }
    }

    // Legacy dismissal preferences must no longer hide the assistant.
    sessionStorage.setItem('easyamt-mascot-hidden', '1')
    await act(async () => root.render(<MascotPanel state="reading" />))
    assert(!!host.querySelector('.mascot-panel') && !host.querySelector('.mascot-close, .mascot-restore, .mascot-motion-toggle'), 'assistant always visible without close, restore, or motion controls')
    await tick(125)
    const positionBeforeStateChange = host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundPosition
    await act(async () => root.render(<MascotPanel state="thinking" />))
    assert(host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundPosition === positionBeforeStateChange, 'pipeline state changes do not restart animation')
    await tick(125)
    assert(host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundPosition !== positionBeforeStateChange, 'same sprite continues advancing across state changes')
    let activated = 0
    await act(async () => root.render(<MascotPanel state="reading" onActivate={() => { activated++ }} />))
    const questionTrigger = host.querySelector<HTMLButtonElement>('.mascot-chat-trigger')!
    assert(questionTrigger.textContent === '?' && questionTrigger.getAttribute('aria-label') === i18n.t('mascot.chat.open'), 'question control is a labeled question mark')
    await act(async () => questionTrigger.click())
    assert(activated === 1, 'question mark activates chat')
    await act(async () => root.render(null))

    // onEnd fires exactly once, including when its callback identity changes.
    const { useSpriteAnimation } = await import('./useSpriteAnimation')
    let ended = 0
    const clip = { row: 0, frames: 2, fps: 10, loop: false }
    function Probe() {
      const frame = useSpriteAnimation(clip, false, () => { ended++ })
      return <span>{frame}</span>
    }
    await act(async () => root.render(<Probe />))
    await tick(100)
    await act(async () => root.render(<Probe />))
    await tick(1000)
    assert(ended === 1 && timers.size === 0, 'non-loop end fires once despite callback rerenders')

    // Exercise the actual chat UI, using an intercepted HTTP boundary (no paid inference).
    await act(async () => root.render(null))
    const calls: Array<{ url: string; init: RequestInit }> = []
    let resolveFetch: (response: Response) => void = () => {}
    window.fetch = async (url, init) => {
      calls.push({ url: String(url), init: init! })
      return new Promise<Response>((resolve) => { resolveFetch = resolve })
    }
    await act(async () => root.render(<DocumentCompanion key="one" token="test-token" documentId="one" status="completed" stage={null} />))
    assert(calls.length === 0, 'opening a document sends no chat requests')

    const catBottomBeforeChat = host.querySelector('.mascot-controls')!.getBoundingClientRect().bottom

    await act(async () => host.querySelector<HTMLButtonElement>('.mascot-chat-trigger')!.click())
    assert(!!host.querySelector('textarea'), 'question button opens the chat form')

    const inputBox = host.querySelector('.mascot-composer')!.getBoundingClientRect()
    const statusBox = host.querySelector('.mascot-bubble')!.getBoundingClientRect()
    const messagesBox = host.querySelector('.mascot-messages')!.getBoundingClientRect()
    assert(inputBox.bottom <= statusBox.top, 'question composer appears above the cat status bubble')
    assert(messagesBox.bottom <= inputBox.top, 'conversation bubbles appear above the question composer')
    assert(Math.abs(host.querySelector('.mascot-controls')!.getBoundingClientRect().bottom - catBottomBeforeChat) < 1, 'opening chat keeps the cat anchored at the same height')

    const setTextarea = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    await act(async () => {
      const input = host.querySelector('textarea')!
      setTextarea.call(input, 'What must I send?')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    assert(calls.length === 1 && calls[0].url.endsWith('/v1/documents/one/chat'), 'question uses the document chat endpoint')
    assert(host.querySelector('.mascot-sprite')?.getAttribute('data-state') === 'idle', 'waiting for a reply keeps the base pose')
    assert((host.querySelector('textarea') as HTMLTextAreaElement).disabled, 'pending question prevents duplicate sends')
    assert(host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundImage.includes('catpack-idle.png'), 'waiting keeps the same base sprite')
    await act(async () => resolveFetch(new Response(JSON.stringify({
      scope: 'document', answer: 'Send the missing records. <script>bad()</script>',
      citations: [{ page: 1, quote: 'Bitte reichen Sie die Unterlagen ein.' }],
      grounded: true, needs_clarification: false, suggested_followups: ['What is the deadline?'],
    }))))
    assert(host.querySelector('.mascot-sprite')?.getAttribute('data-state') === 'responding', 'received answer uses responding pose')
    assert(host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundImage.includes('catpack-answer.png'), 'answer changes to a different sprite asset')
    assert(host.textContent?.includes('Bitte reichen Sie die Unterlagen ein.') && !host.querySelector('script'), 'answer and citations render as text')

    assert(Math.abs(host.querySelector('.mascot-controls')!.getBoundingClientRect().bottom - catBottomBeforeChat) < 1, 'receiving an answer does not push the cat upward')
    const messageBubbles = host.querySelectorAll('.mascot-message')
    assert(messageBubbles.length === 2 && messageBubbles[0].classList.contains('user') && messageBubbles[1].classList.contains('assistant'), 'question and answer appear as separate chronological bubbles')


    await act(async () => host.querySelector<HTMLButtonElement>('.mascot-chat-trigger')!.click())
    assert(!host.querySelector('.mascot-chat') && !!host.querySelector('.mascot-panel') && host.querySelector('.mascot-sprite')?.getAttribute('data-state') === 'idle', 'question mark folds chat and returns to base sprite without hiding assistant')
    await act(async () => host.querySelector<HTMLButtonElement>('.mascot-chat-trigger')!.click())
    assert(!!host.querySelector('.mascot-chat') && host.querySelector('.mascot-sprite')?.getAttribute('data-state') === 'responding', 'question mark reopens existing answer')

    await act(async () => host.querySelector<HTMLButtonElement>('.mascot-followups button')!.click())
    assert(host.querySelector('textarea')!.value === 'What is the deadline?', 'suggested followup fills the question')
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const secondBody = JSON.parse(calls[1].init.body as string)
    assert(secondBody.history.length === 2 && secondBody.history[0].role === 'user' && secondBody.history[1].role === 'assistant', 'next question includes bounded conversation history')
    await act(async () => resolveFetch(new Response(JSON.stringify({ code: 'quota_exceeded' }), { status: 429 })))
    assert(host.querySelector('[role="alert"]')?.textContent === i18n.t('mascot.chat.errors.quota_exceeded'), 'quota error is localized')
    assert(host.querySelector('textarea')!.value === 'What is the deadline?' && !host.querySelector('textarea')!.disabled, 'failed request preserves question for retry')

    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await act(async () => resolveFetch(new Response(JSON.stringify({
      scope: 'document', answer: 'A longer answer about the letter. '.repeat(40),
      citations: [], grounded: false, needs_clarification: false, suggested_followups: [],
    }))))
    const conversation = host.querySelector<HTMLElement>('.mascot-messages')!
    assert(conversation.scrollHeight > conversation.clientHeight && Math.abs(conversation.scrollHeight - conversation.clientHeight - conversation.scrollTop) < 2, 'long conversations scroll older bubbles upward and keep the newest answer visible')
    assert(Math.abs(host.querySelector('.mascot-controls')!.getBoundingClientRect().bottom - catBottomBeforeChat) < 1, 'growing conversation keeps the cat at the same bottom position')

    await act(async () => root.render(<DocumentCompanion key="two" token="test-token" documentId="two" status="completed" stage={null} />))
    await act(async () => host.querySelector<HTMLButtonElement>('.mascot-chat-trigger')!.click())
    assert(!host.querySelector('.mascot-message') && host.querySelector('textarea')!.value === '', 'switching documents clears conversation')
    await act(async () => {
      const input = host.querySelector('textarea')!
      setTextarea.call(input, 'A new question')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const signal = calls.at(-1)!.init.signal!
    await act(async () => root.render(null))
    assert(signal.aborted, 'leaving document aborts outstanding chat')
    await act(async () => resolveFetch(new Response(JSON.stringify({ answer: 'Late answer' }))))
    await act(async () => root.render(<DocumentCompanion key="processing" token="test-token" documentId="three" status="processing" stage="extracting" />))
    assert(!host.querySelector('.mascot-chat-trigger'), 'questions are unavailable until document analysis finishes')
    await act(async () => root.render(null))


    await act(async () => { reduced = true })
    await act(async () => root.render(<MascotPanel state="reading" />))
    assert(host.querySelector('.mascot-sprite')?.getAttribute('data-animated') === 'true', 'explicit constant animation plays even with system reduced motion')
    const firstPosition = host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundPosition
    await tick(125)
    assert(host.querySelector<HTMLElement>('.mascot-sprite')!.style.backgroundPosition !== firstPosition, 'assistant animates without requiring a play button')
    await act(async () => root.render(null))
    assert(timers.size === 0, 'constant animation cleans up on unmount')

  } catch (error) {
    return { passed: false, results, error: String(error) }
  } finally {
    await act(async () => root.unmount())
    host.remove()
    window.fetch = originalFetch
    window.setInterval = originalInterval
    window.clearInterval = originalClear
    window.matchMedia = originalMatchMedia
    if (savedPreference === null) sessionStorage.removeItem('easyamt-mascot-hidden')
    else sessionStorage.setItem('easyamt-mascot-hidden', savedPreference)
    await i18n.changeLanguage(originalLanguage)
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false })
  }
  return { passed: true, results }
}
