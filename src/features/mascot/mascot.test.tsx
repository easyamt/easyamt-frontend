import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PixelMascot from './PixelMascot'
import { MASCOT_SHEET, statusToMascotState } from './mascotStates'
import { nextFrame } from './useSpriteAnimation'

describe('statusToMascotState', () => {
  it.each([
    [{}, 'idle'],
    [{ status: null }, 'idle'],
    [{ status: 'failed', needsAnchor: true }, 'confused'],
    [{ status: 'completed' }, 'celebrating'],
    [{ status: 'completed', needsAnchor: true }, 'asking'],
    [{ status: 'queued', stage: 'interpreting' }, 'reading'],
    [{ status: 'processing', stage: 'interpreting' }, 'thinking'],
    ...['validating', 'planning', 'persisting'].map((stage) => [{ status: 'processing', stage }, 'checking'] as const),
    ...['inspecting', 'extracting', 'unknown', null, undefined].map((stage) => [{ status: 'processing', stage }, 'reading'] as const),
  ] as const)('maps %j to %s', (input, expected) => {
    expect(statusToMascotState(input)).toBe(expected)
  })
})

describe('nextFrame', () => {
  it('advances and wraps looping clips', () => {
    expect(nextFrame(0, 3, true)).toEqual({ frame: 1, finished: false })
    expect(nextFrame(2, 3, true)).toEqual({ frame: 0, finished: false })
  })
  it('holds the last non-looping frame, including a one-frame clip', () => {
    expect(nextFrame(2, 3, false)).toEqual({ frame: 2, finished: true })
    expect(nextFrame(0, 1, false)).toEqual({ frame: 0, finished: true })
  })
})

describe('PixelMascot markup', () => {
  it('is decorative unless a label is supplied', () => {
    expect(renderToStaticMarkup(<PixelMascot state="idle" />)).toContain('aria-hidden="true"')
    const html = renderToStaticMarkup(<PixelMascot state="idle" label="Cat" />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Cat"')
    expect(html).not.toContain('aria-hidden')
  })
  it('uses sheet geometry, row offsets, integer zoom, and mirroring', () => {
    const config = { ...MASCOT_SHEET, rows: 2, clips: { ...MASCOT_SHEET.clips, reading: { row: 1, frames: 3, fps: 5, loop: true } } }
    const html = renderToStaticMarkup(<PixelMascot state="reading" config={config} scale={2.9} flip />)
    expect(html).toContain('width:64px;height:64px')
    expect(html).toContain('background-size:640px 128px')
    expect(html).toContain('background-position:0px -64px')
    expect(html).toContain('transform:scaleX(-1)')
    expect(html).toContain('image-rendering:pixelated')
  })
})
