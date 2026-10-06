import type { AuthRole } from './auth'

const TOKEN_KEY = 'token'
const ROLE_KEY = 'role'

export interface TokenPayload {
  id?: string
  role?: AuthRole
  iat?: number
  exp?: number
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token || token === 'null' || token === 'undefined') return null
  return token
}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeToken(token: string | null): TokenPayload | null {
  if (!token) return null
  const segments = token.split('.')
  if (segments.length !== 3) return null
  try {
    const payload = JSON.parse(base64UrlDecode(segments[1]))
    return payload && typeof payload === 'object' ? (payload as TokenPayload) : null
  } catch {
    return null
  }
}

export function isTokenValid(requiredRole?: AuthRole): boolean {
  const token = getStoredToken()
  if (!token) return false
  const payload = decodeToken(token)
  if (!payload) return false
  if (!payload.exp || payload.exp * 1000 <= Date.now()) return false
  if (requiredRole && payload.role !== requiredRole) return false
  return true
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function logout(loginPath: string) {
  clearAuth()
  if (typeof window !== 'undefined') window.location.replace(loginPath)
}

function loginPathFor(path: string): string {
  if (path.startsWith('/api/admin')) return '/admin/login'
  if (path.startsWith('/api/employee')) return '/employee/login'
  return '/login'
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit & { skipAuthRedirect?: boolean } = {}
): Promise<T> {
  const { skipAuthRedirect, headers, ...rest } = init

  const requestHeaders = new Headers(headers)
  const token = getStoredToken()
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)
  if (rest.body && !requestHeaders.has('Content-Type') && typeof rest.body === 'string') {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, { ...rest, headers: requestHeaders })
  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: T; error?: string }
    | null

  if (response.status === 401) {
    clearAuth()
    if (!skipAuthRedirect && typeof window !== 'undefined') {
      window.location.replace(loginPathFor(path))
    }
    throw new ApiError(401, payload?.error || 'Session expired. Please sign in again.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error || `Request failed (${response.status})`)
  }

  return payload as T
}
