import { apiRequest } from '../../shared/api/client'

// Mirrors the response models on the checked-out backend branch. Regenerate from
// OpenAPI when its contract is frozen; never infer verified evidence from candidates.
export type DocumentStatus = 'queued' | 'processing' | 'completed' | 'failed'
export interface DocumentRecord {
  id: string
  file_sha256: string
  output_language: 'en' | 'de' | 'es'
  status: DocumentStatus
  stage: string | null
  error_code: string | null
  document_type: string | null
  detected_language: string | null
  page_count: number | null
  has_scanned_pages: boolean
  letter_date: string | null
  receipt_date: string | null
  summary: string | null
  warnings: unknown[]
  analyzed_at: string | null
  created_at: string
  updated_at: string
}

export interface CandidateEvidence {
  id: string
  page: number
  quote: string
  verification: string
  match_score: number | null
  boxes: Array<{ x0: number; y0: number; x1: number; y1: number }> | null
}

export interface CandidateObligation {
  id: string
  local_id: string
  action: string
  description: string | null
  required_documents: string[]
  consequence: string | null
  conditions: string | null
  payment_text: string | null
  confidence_label: string | null
  deadline: {
    kind: string
    date: string | null
    amount: number | null
    unit: string | null
    anchor: string | null
    anchor_text: string | null
    quote: string | null
    status: string
    due_date: string | null
  }
  verification: string | null
  evidence: CandidateEvidence[]
}

export interface DocumentAnalysis {
  document: DocumentRecord
  obligations: CandidateObligation[]
  interpretation_verified: false
}

export function uploadDocument(token: string, file: File, outputLanguage: 'es' | 'en' | 'de') {
  const body = new FormData()
  body.append('file', file)
  body.append('output_language', outputLanguage)
  return apiRequest<DocumentRecord>('/v1/documents/upload', token, { method: 'POST', body })
}

export function listDocuments(token: string) {
  return apiRequest<DocumentRecord[]>('/v1/documents?limit=100', token)
}

export function getDocumentStatus(token: string, id: string) {
  return apiRequest<DocumentRecord>(`/v1/documents/${encodeURIComponent(id)}/status`, token)
}

export function getDocumentAnalysis(token: string, id: string) {
  return apiRequest<DocumentAnalysis>(`/v1/documents/${encodeURIComponent(id)}/analysis`, token)
}

export function deleteDocument(token: string, id: string) {
  return apiRequest<void>(`/v1/documents/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
}
