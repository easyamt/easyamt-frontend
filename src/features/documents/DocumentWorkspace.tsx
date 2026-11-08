import { useEffect, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/client'
import { config } from '../../shared/config'
import { validatePdf } from '../upload/validation'
import type { PdfValidationError } from '../upload/validation'
import { deleteDocument, getDocumentAnalysis, listDocuments, uploadDocument } from './api'
import type { DocumentRecord } from './api'
import { getRememberedPdf, matchesPdfHash, rememberPdf } from './pdfStore'
import { useDocumentStatus } from './useDocumentStatus'

type Screen = 'upload' | 'list' | 'detail'

function errorKey(error: unknown): string {
  if (error instanceof ApiError) return `apiErrors.${error.code}`
  return 'apiErrors.request_failed'
}

function UploadPanel({ token, onUploaded }: { token: string; onUploaded: (document: DocumentRecord) => void }) {
  const { t, i18n } = useTranslation()
  const localBackend = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(config.apiBaseUrl)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<PdfValidationError | null>(null)
  const [dragging, setDragging] = useState(false)
  const [consent, setConsent] = useState(false)
  const [language, setLanguage] = useState<'es' | 'en' | 'de'>(i18n.language === 'en' || i18n.language === 'de' ? i18n.language : 'es')
  const mutation = useMutation({
    mutationFn: () => uploadDocument(token, file!, language),
    onSuccess: (document) => { rememberPdf(document.id, file!); onUploaded(document) },
  })

  function acceptFile(candidate: File | null) {
    const problem = candidate ? validatePdf(candidate) : null
    setFile(problem ? null : candidate)
    setError(problem)
    mutation.reset()
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0] ?? null)
    // Let the same file be selected again after an error or a completed upload.
    event.target.value = ''
  }

  function dropFile(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0] ?? null)
  }

  return <section className="workspace-panel">
    <p className="eyebrow">{t('uploadEyebrow')}</p><h1>{t('uploadTitle')}</h1><p className="muted">{t('uploadIntro')}</p>
    <div className="upload-card">
      <input id="analysis-pdf" className="file-picker-input" type="file" accept="application/pdf,.pdf" aria-label={t('chooseFile')} onChange={selectFile} />
      <label htmlFor="analysis-pdf" className={`file-picker${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }} onDrop={dropFile}>
        <span className="upload-icon" aria-hidden="true">↥</span><strong>{t(file ? 'changeFile' : 'chooseFile')}</strong><small>{file ? file.name : t('dropHint')}</small>
      </label>
      {error && <p className="error" role="alert">{t(error)}</p>}
      {file && <p className="selected-file"><strong>{t('selectedFile')}:</strong> {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
      <label className="select-label">{t('outputLanguage')}<select value={language} onChange={(event) => setLanguage(event.target.value as 'es' | 'en' | 'de')}><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option></select></label>
      <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{t('consent')}</label>
      {mutation.error && <p className="error" role="alert">{t(errorKey(mutation.error))}</p>}
      {import.meta.env.DEV && mutation.error && !(mutation.error instanceof ApiError) && <p className="pending">{t(localBackend ? 'devBackendHint' : 'devRemoteBackendHint', { url: config.apiBaseUrl })}</p>}
      <button type="button" className="button primary upload-submit" disabled={!file || !consent || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? t('uploading') : t('submitUpload')}</button>
      <p className="pending">{t('candidateNotice')}</p>
    </div>
  </section>
}

function PdfPreview({ document }: { document: DocumentRecord }) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(() => getRememberedPdf(document.id) ?? null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!file) { setUrl(null); return }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  async function reattach(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0]
    if (!candidate) return
    if (validatePdf(candidate) || !await matchesPdfHash(candidate, document.file_sha256)) {
      setError(t('wrongPdf'))
      event.target.value = ''
      return
    }
    setError('')
    rememberPdf(document.id, candidate)
    setFile(candidate)
  }

  return <section className="pdf-panel"><h3>{t('originalPdf')}</h3>{url ? <iframe title={t('originalPdf')} src={url} /> : <label className="reattach">{t('reattachPdf')}<input type="file" accept="application/pdf,.pdf" onChange={(event) => { void reattach(event) }} /></label>}{error && <p className="error" role="alert">{error}</p>}</section>
}

function DetailPanel({ token, id, onBack, onDeleted }: { token: string; id: string; onBack: () => void; onDeleted: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const status = useDocumentStatus(token, id)
  const document = status.data
  const analysis = useQuery({ queryKey: ['analysis', id], queryFn: () => getDocumentAnalysis(token, id), enabled: document?.status === 'completed' })
  const deletion = useMutation({ mutationFn: () => deleteDocument(token, id), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['documents'] }); onDeleted() } })

  return <section className="detail-panel">
    <button className="text-button" onClick={onBack}>← {t('backToDocuments')}</button>
    {status.isLoading && <p>{t('loading')}</p>}
    {status.error && <p className="error" role="alert">{t(errorKey(status.error))}</p>}
    {document && <>
      <div className="detail-heading"><div><p className="eyebrow">{t('document')}</p><h1>{t('document')} · {document.id.slice(0, 8)}</h1><p className="muted">{new Date(document.created_at).toLocaleString()}</p></div><button className="button danger" disabled={deletion.isPending} onClick={() => { if (window.confirm(t('confirmDelete'))) deletion.mutate() }}>{t('deleteDocument')}</button></div>
      {deletion.error && <p className="error">{t(errorKey(deletion.error))}</p>}
      {(document.status === 'queued' || document.status === 'processing') && <div className="progress-card"><div className="status-line"><strong>{t('status.' + document.status)}</strong><span>{t('stage.' + (document.stage ?? 'unknown'))}</span></div><div className="progress-track"><span /></div><p>{t('processingHint')}</p>{Date.now() - new Date(document.created_at).getTime() > 300_000 && <p>{t('longWait')}</p>}</div>}
      {document.status === 'failed' && <div className="progress-card"><h2>{t('analysisFailed')}</h2><p className="error">{t('apiErrors.' + (document.error_code ?? 'request_failed'))}</p></div>}
      {document.status === 'completed' && <>
        {analysis.isLoading && <p>{t('loading')}</p>}
        {analysis.error && <p className="error">{t(errorKey(analysis.error))}</p>}
        {analysis.data && <><div className="candidate-banner">{t('candidateNotice')}</div><section className="result-card"><p className="eyebrow">{t('summary')}</p><h2>{analysis.data.document.summary || t('noSummary')}</h2></section><div className="result-grid"><div><h2>{t('candidateObligations')}</h2>{analysis.data.obligations.length === 0 && <p className="muted">{t('noObligations')}</p>}{analysis.data.obligations.map((obligation, index) => <article className="obligation-card" key={obligation.id}><p className="eyebrow">{t('obligation')} {index + 1}</p><h3>{obligation.action}</h3>{obligation.description && <p>{obligation.description}</p>}{obligation.required_documents.length > 0 && <><strong>{t('requiredDocuments')}</strong><ul>{obligation.required_documents.map((item, i) => <li key={i}>{item}</li>)}</ul></>}{obligation.consequence && <p><strong>{t('consequence')}:</strong> {obligation.consequence}</p>}{obligation.deadline.quote && <p><strong>{t('deadlineMention')}:</strong> {obligation.deadline.quote}</p>}{obligation.evidence.map((evidence) => <blockquote key={evidence.id}><span>{t('candidateEvidence')} · {t('page')} {evidence.page}</span><p lang="de">“{evidence.quote}”</p></blockquote>)}</article>)}</div><PdfPreview document={document} /></div></>}
      </>}
    </>}
  </section>
}

export default function DocumentWorkspace({ token, screen, setScreen }: { token: string; screen: Screen; setScreen: (screen: Screen) => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const documents = useQuery({ queryKey: ['documents'], queryFn: () => listDocuments(token), enabled: screen === 'list' })

  if (screen === 'upload') return <UploadPanel token={token} onUploaded={(document) => { setSelectedId(document.id); void queryClient.invalidateQueries({ queryKey: ['documents'] }); setScreen('detail') }} />
  if (screen === 'detail' && selectedId) return <DetailPanel token={token} id={selectedId} onBack={() => setScreen('list')} onDeleted={() => setScreen('list')} />
  return <section className="workspace-panel"><p className="eyebrow">EASYAMT</p><h1>{t('documentsTitle')}</h1><button className="button primary list-upload" onClick={() => setScreen('upload')}>{t('navAnalyze')}</button>{documents.isLoading && <p>{t('loading')}</p>}{documents.error && <p className="error">{t(errorKey(documents.error))}</p>}{documents.data?.length === 0 && <div className="empty-state">{t('documentsEmpty')}</div>}{documents.data?.map((document) => <button className="document-row" key={document.id} onClick={() => { setSelectedId(document.id); setScreen('detail') }}><span><strong>{document.summary || `${t('document')} · ${document.id.slice(0, 8)}`}</strong><small>{new Date(document.created_at).toLocaleDateString()} · {document.page_count ?? '—'} {t('pages')}</small></span><span className="status-pill">{t('status.' + document.status)}</span></button>)}</section>
}
