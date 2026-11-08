import { config } from '../config'

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(new URL(path, config.apiBaseUrl), { ...init, headers })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { code?: string; detail?: string } | null
    throw new ApiError(response.status, problem?.code ?? 'request_failed', problem?.detail ?? `API request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
