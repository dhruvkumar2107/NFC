import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { signToken, comparePassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const normalizePhone = (v?: string | null) => (v || '').replace(/\D/g, '')
const normalizeName = (v?: string | null) => (v || '').trim().replace(/\s+/g, ' ').toLowerCase()
const normalizeEmail = (v?: string | null) => (v || '').trim().toLowerCase()

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`customer-login:${ip}`, 30, 60_000)) {
      return errorResponse('Too many login attempts. Please try again in a minute.', 429)
    }

    const body = await request.json()
    const rawId = (body.identifier || body.phone || body.mobile || body.email || '').trim()
    const rawCred = (body.credential || body.password || body.name || body.fullName || '').trim()

    if (!rawId && !rawCred) {
      return errorResponse('Please enter your phone number or email')
    }

    const isEmail = rawId.includes('@')
    const emailToSearch = isEmail ? normalizeEmail(rawId) : null

    let phoneDigits = normalizePhone(rawId)
    // If the user swapped the name/phone fields:
    if (phoneDigits.length < 10 && normalizePhone(rawCred).length >= 10) {
      phoneDigits = normalizePhone(rawCred)
    }

    let candidates: any[] = []

    if (emailToSearch) {
      candidates = await prisma.customer.findMany({
        where: {
          email: { equals: emailToSearch, mode: 'insensitive' },
        },
      })
    }

    if (candidates.length === 0 && phoneDigits.length >= 10) {
      const last10 = phoneDigits.slice(-10)
      candidates = await prisma.customer.findMany({
        where: {
          OR: [
            { mobile: { contains: last10 } },
            { whatsapp: { contains: last10 } },
          ],
        },
      })

      if (candidates.length === 0) {
        const all = await prisma.customer.findMany({
          where: {
            OR: [{ mobile: { not: null } }, { whatsapp: { not: null } }],
          },
        })
        candidates = all.filter((c) => {
          const m = normalizePhone(c.mobile)
          const w = normalizePhone(c.whatsapp)
          return m.includes(last10) || w.includes(last10)
        })
      }
    }

    // 1b. Fall back to matching by name (covers records with a missing/invalid phone).
    if (candidates.length === 0 && !isEmail) {
      const nameQuery = normalizeName(rawId) || normalizeName(rawCred)
      if (nameQuery) {
        const all = await prisma.customer.findMany()
        const exact = all.filter((c) => normalizeName(c.name) === nameQuery)
        if (exact.length > 0) {
          candidates = exact
        } else {
          const partial = all.filter((c) => {
            const n = normalizeName(c.name)
            return n.includes(nameQuery) || nameQuery.includes(n)
          })
          if (partial.length === 1) candidates = partial
        }
      }
    }

    if (candidates.length === 0) {
      return errorResponse('No account found with this phone number or email')
    }

    let authenticatedCustomer: any = null

    // 1. Check password verification if provided or if credential matches passwordHash
    if (rawCred) {
      for (const c of candidates) {
        if (c.passwordHash) {
          try {
            const match = await comparePassword(rawCred, c.passwordHash)
            if (match) {
              authenticatedCustomer = c
              break
            }
          } catch {}
        }
      }
    }

    // 2. Check name verification
    if (!authenticatedCustomer) {
      const nameInput = normalizeName(rawCred || rawId)
      if (nameInput) {
        const exactMatch = candidates.find((c) => normalizeName(c.name) === nameInput)
        if (exactMatch) {
          authenticatedCustomer = exactMatch
        } else {
          const partialMatch = candidates.find((c) => {
            const cNorm = normalizeName(c.name)
            return cNorm.includes(nameInput) || nameInput.includes(cNorm)
          })
          if (partialMatch) {
            authenticatedCustomer = partialMatch
          }
        }
      }
    }

    // 3. Fallback: unique account match for this phone / email
    if (!authenticatedCustomer && candidates.length === 1) {
      authenticatedCustomer = candidates[0]
    }

    if (!authenticatedCustomer) {
      return errorResponse('Could not verify account. Please enter your full name as used during order or your password.')
    }

    const token = await signToken({ id: authenticatedCustomer.id, role: 'customer' })
    return successResponse({
      token,
      customer: {
        id: authenticatedCustomer.id,
        name: authenticatedCustomer.name,
        email: authenticatedCustomer.email,
        mobile: authenticatedCustomer.mobile,
        cardId: authenticatedCustomer.cardId,
      },
    })
  } catch (err: any) {
    console.error('Customer login error:', err)
    return errorResponse(err.message || 'Login failed', 500)
  }
}
