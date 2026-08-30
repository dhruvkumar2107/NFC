import { verifyToken, AuthPayload } from './auth'
import { unauthorized, forbidden } from './api-response'
import { NextRequest } from 'next/server'

export async function getAuthUser(request: NextRequest): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

export async function requireAuth(request: NextRequest, role?: string) {
  const user = await getAuthUser(request)
  if (!user) return { user: null, error: unauthorized() }
  if (role && user.role !== role) return { user: null, error: forbidden() }
  return { user, error: null }
}
