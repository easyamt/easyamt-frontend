import { describe, expect, it } from 'vitest'
import { MAX_PDF_BYTES, validatePdf } from './validation'

describe('validatePdf', () => {
  it('accepts a PDF within the upload limit', () => {
    expect(validatePdf(new File(['pdf'], 'letter.pdf', { type: 'application/pdf' }))).toBeNull()
  })

  it('rejects empty, oversized and non-PDF files', () => {
    expect(validatePdf(new File([], 'letter.pdf', { type: 'application/pdf' }))).toBe('emptyFile')
    expect(validatePdf(new File([new Uint8Array(MAX_PDF_BYTES + 1)], 'letter.pdf', { type: 'application/pdf' }))).toBe('tooLarge')
    expect(validatePdf(new File(['text'], 'letter.txt', { type: 'text/plain' }))).toBe('notPdf')
  })
})
