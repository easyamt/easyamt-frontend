const files = new Map<string, File>()

export function rememberPdf(id: string, file: File) { files.set(id, file) }
export function getRememberedPdf(id: string) { return files.get(id) }
export function clearPdfs() { files.clear() }

export async function matchesPdfHash(file: File, expected: string): Promise<boolean> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return actual === expected.toLowerCase()
}
