import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../shared/api/client'
import { askDocument } from './chatApi'
import type { ChatMessage } from './chatApi'

export function useDocumentChat(token: string, documentId: string, language: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort(); request.current = null }, [])

  async function send(question: string): Promise<boolean> {
    const message = question.trim()
    if (!message || Array.from(message).length > 1000 || request.current) return false
    const controller = new AbortController()
    request.current = controller
    setError('')
    setPendingQuestion(message)
    try {
      const reply = await askDocument(token, documentId, message, messages, language, controller.signal)
      if (controller.signal.aborted) return false
      setMessages([...messages, { role: 'user', content: message }, { role: 'assistant', content: reply.answer, reply }])
      return true
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof ApiError ? cause.code : 'request_failed')
      return false
    } finally {
      if (request.current === controller) {
        request.current = null
        setPendingQuestion('')
      }
    }
  }
  return { messages, pendingQuestion, error, send }
}
