import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { MascotState } from './mascotStates'
import PixelMascot from './PixelMascot'
import { useMediaQuery } from './useMediaQuery'
import './mascot.css'

export default function MascotPanel({ state, onActivate, children, chatOpen = false }: {
  state: MascotState; onActivate?: () => void; children?: ReactNode; chatOpen?: boolean
}) {
  const { t } = useTranslation()
  const narrow = useMediaQuery('(max-width: 600px)')
  // Keep playback continuous through pipeline updates; only an answer changes the pose.
  const spriteState = state === 'responding' ? 'responding' : 'idle'
  const chatLabel = t(chatOpen ? 'mascot.chat.close' : 'mascot.chat.open')
  return <div className="mascot-dock">
    <aside className="mascot-panel" aria-label={t('mascot.name')}>
      {children}
      <div className="mascot-bubble" aria-live="polite" aria-atomic="true">{t(`mascot.${state}`)}</div>
      <div className="mascot-controls">
        <PixelMascot state={spriteState} scale={narrow ? 3 : 4} motion="play" />
        {onActivate && <button type="button" className="mascot-chat-trigger" aria-label={chatLabel} title={chatLabel} aria-expanded={chatOpen} onClick={onActivate}><span aria-hidden="true">?</span></button>}
      </div>

    </aside>
  </div>
}
