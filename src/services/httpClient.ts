import { env } from '@/config/env'
import { getStoredToken } from '@/lib/authStorage'
import type { ApiFieldError, ApiResponse } from '@/types/auth'

/** Error carrying the HTTP status and the API's `{ success, message }` body. */
export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown
  /** Per-field messages from a 400 "Validation failed." response. */
  readonly fieldErrors: ApiFieldError[]

  constructor(message: string, status: number, payload?: unknown, fieldErrors: ApiFieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    this.fieldErrors = fieldErrors
  }

  /** True when the request never reached the server. */
  get isNetworkError(): boolean {
    return this.status === 0
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Attach the stored bearer token (default: true). */
  auth?: boolean
  /**
   * Whether a 401 means "this token is dead" (default: true).
   * Set false on endpoints where 401 reports a credential the user just typed —
   * a wrong current password must not sign them out.
   */
  signOutOn401?: boolean
}

/**
 * Called when an authenticated request comes back 401 — the token was rejected
 * by the server (revoked, or expired earlier than the client believed).
 * AuthContext registers itself here so the app signs out immediately.
 */
type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Please check your connection and try again.'

/**
 * Thin `fetch` wrapper that unwraps the API envelope and normalises failures
 * into `ApiError`, so callers only deal with `data` or a thrown error.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, signOutOn401 = true, headers, ...init } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')

  if (auth) {
    const token = getStoredToken()
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0)
  }

  let payload: ApiResponse<T> | null = null
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    // No JSON envelope on a 5xx means the API (or the dev proxy in front of it)
    // is down — a bare status code says nothing useful to the user there.
    const message =
      payload?.message ??
      (response.status >= 500
        ? NETWORK_ERROR_MESSAGE
        : `Request failed with status ${response.status}.`)

    // A rejected token only means anything on requests that actually sent one,
    // and only where 401 cannot mean "wrong credentials you just typed".
    if (response.status === 401 && auth && signOutOn401) onUnauthorized?.()

    throw new ApiError(message, response.status, payload, payload?.errors ?? [])
  }

  return payload.data as T
}
