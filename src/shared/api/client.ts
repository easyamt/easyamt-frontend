import { config } from '../config'

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(new URL(path, config.apiBaseUrl), { ...init, headers })
  if (!response.ok) throw new ApiError(response.status, `API request failed (${response.status})`)
  return response.json() as Promise<T>
}
