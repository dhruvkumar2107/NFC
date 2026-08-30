import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export type AuthRole = 'customer' | 'employee' | 'admin'

export interface AuthPayload {
  id: string
  role: AuthRole
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ id: payload.id, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { id: payload.id as string, role: payload.role as AuthRole }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateCardId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString()
  return `MSC${digits}`
}

export function generateOrderId(): string {
  const digits = Math.floor(10000 + Math.random() * 90000).toString()
  return `ORD-${digits}`
}

export function generateEmployeeId(sequence: number): string {
  const padded = sequence.toString().padStart(3, '0')
  return `MSC-SE-${padded}`
}

export function generateReferralCode(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20) + 'shref'
}
