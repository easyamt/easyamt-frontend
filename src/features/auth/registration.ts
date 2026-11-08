import { config } from '../../shared/config'

export async function registrationEmailError(email: string): Promise<string | null> {
  const response = await fetch(new URL('/v1/auth/registration-check', config.apiBaseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (response.status === 429) return 'authRateLimit'
  if (response.status === 422) return 'authInvalidEmail'
  if (response.status === 404) return 'authRegistrationUnavailable'
  if (!response.ok) return 'authConnectionError'
  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('exists' in result) || typeof result.exists !== 'boolean') return 'authConnectionError'
  return result.exists ? 'authEmailExists' : null
}
