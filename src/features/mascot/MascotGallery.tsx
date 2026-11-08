import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PixelMascot from './PixelMascot'
import DocumentCompanion from './DocumentCompanion'
import { MASCOT_SHEET } from './mascotStates'
import type { MascotState } from './mascotStates'

const states = Object.keys(MASCOT_SHEET.clips) as MascotState[]

export default function MascotGallery() {
  const { i18n } = useTranslation()
  const [state, setState] = useState<MascotState>('reading')
  if (new URLSearchParams(window.location.search).has('check')) return null
  return <main style={{ padding: 24, maxWidth: 1100, margin: 'auto' }}>
    <h1>CatPackFree mascot gallery</h1>
    <p>32 × 32 frames. Idle: 320 × 32 / 10 frames; box: 128 × 32 / 4; costume: 192 × 32 / 6. Each strip has one row (0).</p>
    <p>The assistant continuously plays the idle pose, changing only when showing an answer. The clips below are the raw pack catalogue. The selected preview follows the assistant behavior.</p>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {states.map((clipState) => <section key={clipState}>
        <h2>{clipState}</h2><p>Row 0 · {MASCOT_SHEET.clips[clipState].frames} frames</p>
        <PixelMascot state={clipState} label={clipState} scale={3} />
      </section>)}
    </div>
    <section className="detail-panel">
      <h2>State preview</h2>
      <label>State <select value={state} onChange={(event) => setState(event.target.value as MascotState)}>{states.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label> Language <select value={i18n.language} onChange={(event) => { void i18n.changeLanguage(event.target.value) }}><option value="en">English</option><option value="es">Español</option><option value="de">Deutsch</option></select></label>
      <PixelMascot state={state === 'responding' ? 'responding' : 'idle'} scale={4} label="Selected state" motion="play" />
      <label>Example field <input placeholder="A document control" /></label>
      <DocumentCompanion token="" documentId="preview" status="processing" stage="extracting" />
      <p>The gallery does not send chat requests. In a completed document, click the ? symbol to open or fold chat; the assistant remains visible.</p>
    </section>
  </main>
}
