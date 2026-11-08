import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MascotPanel from './MascotPanel'
import { statusToMascotState } from './mascotStates'
import { useDocumentChat } from './useDocumentChat'

export default function DocumentCompanion({ token, documentId, status, stage, needsAnchor }: {
  token: string; documentId: string; status: string; stage: string | null; needsAnchor?: boolean
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const chat = useDocumentChat(token, documentId, i18n.language)
  const messageLog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) messageLog.current?.scrollTo({ top: messageLog.current.scrollHeight })
  }, [open, chat.messages.length, chat.pendingQuestion])
  const lastReply = chat.messages.at(-1)?.reply
  const state = chat.pendingQuestion ? 'thinking' : chat.error ? 'confused'
    : open && lastReply ? 'responding'
    : statusToMascotState({ status, stage, needsAnchor })

  async function submit(question: string) {
    if (status !== 'completed') return
    if (await chat.send(question)) setDraft('')
  }

  return <MascotPanel state={state} chatOpen={open} onActivate={status === 'completed' ? () => setOpen(!open) : undefined}>
    {status !== 'completed' && <p className="mascot-chat-hint">{t('mascot.chat.notReady')}</p>}
    {open && <section className="mascot-chat" aria-label={t('mascot.chat.title')}>
      <details className="mascot-chat-notice"><summary>{t('mascot.chat.title')}</summary><p>{t('mascot.chat.notice')}</p></details>
      {i18n.language.startsWith('de') && <p className="mascot-chat-hint">{t('mascot.chat.englishFallback')}</p>}
      <div ref={messageLog} className="mascot-messages" role="log" aria-label={t('mascot.chat.messages')} aria-live="polite" aria-relevant="additions">
        {chat.messages.map((message, index) => <article className={`mascot-message ${message.role}`} key={index}>
          <strong>{t(message.role === 'user' ? 'mascot.chat.you' : 'mascot.name')}</strong>
          <p>{message.content}</p>
          {message.reply && <>
            {message.reply.citations.map((citation, citationIndex) => <blockquote key={citationIndex}>{citation.page !== null && <small>{t('page')} {citation.page}</small>}<p>{citation.quote}</p></blockquote>)}
            {!message.reply.grounded && <small>{t('mascot.chat.notGrounded')}</small>}
          </>}
        </article>)}
        {chat.pendingQuestion && <><article className="mascot-message user"><strong>{t('mascot.chat.you')}</strong><p>{chat.pendingQuestion}</p></article><p role="status" className="mascot-message assistant">{t('mascot.chat.waiting')}</p></>}
      {lastReply && !chat.pendingQuestion && <div className="mascot-followups">{lastReply.suggested_followups.map((question, index) => <button type="button" key={index} onClick={() => { setDraft(question) }}>{question}</button>)}</div>}
      </div>
      {chat.error && <p role="alert" className="error">{t(`mascot.chat.errors.${chat.error}`, { defaultValue: t('mascot.chat.errors.request_failed') })}</p>}

      <form className="mascot-composer" onSubmit={(event) => { event.preventDefault(); void submit(draft) }}>
        <label>{t('mascot.chat.question')}<textarea autoFocus value={draft} maxLength={1000} rows={2} disabled={!!chat.pendingQuestion} onChange={(event) => setDraft(event.target.value)} /></label>
        <button type="submit" disabled={!draft.trim() || !!chat.pendingQuestion}>{t(chat.pendingQuestion ? 'mascot.chat.waiting' : 'mascot.chat.send')}</button>
      </form>
    </section>}
  </MascotPanel>
}
