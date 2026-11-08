export const MAX_PDF_BYTES = 5 * 1024 * 1024

export type PdfValidationError = 'notPdf' | 'tooLarge' | 'emptyFile'

export function validatePdf(file: File): PdfValidationError | null {
  if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) return 'notPdf'
  if (file.size === 0) return 'emptyFile'
  if (file.size > MAX_PDF_BYTES) return 'tooLarge'
  return null
}
