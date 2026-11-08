import { apiRequest } from '../../shared/api/client'

export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface ChatReply {
  scope: 'document' | 'general_duties' | 'mixed' | 'out_of_scope'
  answer: string
  citations: Array<{ page: number | null; quote: string }>
  grounded: boolean
  needs_clarification: boolean
  suggested_followups: string[]
}
export interface ChatMessage extends ChatTurn { reply?: ChatReply }

export function chatHistory(messages: readonly ChatTurn[]): ChatTurn[] {
  // Match the backend's default limits. Conversation stays in React memory.
  return messages.slice(-10).map(({ role, content }) => ({ role, content: Array.from(content).slice(0, 2000).join('') }))
}

export function askDocument(token: string, documentId: string, message: string, history: readonly ChatTurn[], language: string, signal?: AbortSignal) {
  return apiRequest<ChatReply>(`/v1/documents/${encodeURIComponent(documentId)}/chat`, token, {
    method: 'POST', signal,
    body: JSON.stringify({ message: message.trim(), history: chatHistory(history), output_language: language.startsWith('es') ? 'es' : 'en' }),
  })
}
