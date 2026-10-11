import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const normalizePhone = (v?: string | null) => (v || '').replace(/\D/g, '')
const normalizeName = (v?: string | null) => (v || '').trim().replace(/\s+/g, ' ').toLowerCase()

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`customer-login:${ip}`, 15, 60_000)) {
      return errorResponse('Too many login attempts. Please try again in a minute.', 429)
    }

    const { name, phone } = await request.json()

    const nameNorm = normalizeName(name)
    const phoneDigits = normalizePhone(phone)
    if (!nameNorm || !phoneDigits) return errorResponse('Name and phone number are required')

    const last10 = phoneDigits.slice(-10)

    const matchesPhone = (c: { mobile: string | null; whatsapp: string | null }) => {
      const m = normalizePhone(c.mobile)
      const w = normalizePhone(c.whatsapp)
      return (
        m === phoneDigits || w === phoneDigits ||
        (last10.length === 10 && (m.slice(-10) === last10 || w.slice(-10) === last10))
      )
    }

    // Fast path: match on the trailing digits directly in the DB.
    let candidates =
      last10.length === 10
        ? await prisma.customer.findMany({
            where: { OR: [{ mobile: { endsWith: last10 } }, { whatsapp: { endsWith: last10 } }] },
          })
        : []

    // Fallback for stored numbers with spaces/punctuation or a shorter input.
    if (candidates.length === 0) {
      candidates = await prisma.customer.findMany({
        where: { OR: [{ mobile: { not: null } }, { whatsapp: { not: null } }] },
      })
    }

    const phoneMatches = candidates.filter(matchesPhone)
    if (phoneMatches.length === 0) {
      return errorResponse('No account found with this phone number')
    }

    const customer =
      phoneMatches.find((c) => normalizeName(c.name) === nameNorm) ||
      (phoneMatches.length === 1 ? phoneMatches[0] : null)

    if (!customer) {
      return errorResponse('No account found with this name and phone number')
    }

    const token = await signToken({ id: customer.id, role: 'customer' })
    return successResponse({
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email, cardId: customer.cardId },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Login failed', 500)
  }
}
