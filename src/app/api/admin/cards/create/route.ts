import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { generateCardId, generateNfcCardNumber, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logActivity } from '@/lib/admin-log'

interface CustomerRecord {
  id: string
  cardId: string | null
  name: string
  designation: string | null
  company: string | null
  mobile: string | null
  email: string | null
}

async function generateUniqueCardId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateCardId()
    const exists = await prisma.card.findUnique({ where: { cardId: candidate }, select: { id: true } })
    if (!exists) return candidate
  }
  throw new Error('Could not generate a unique card ID. Please try again.')
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'admin')
    if (auth.error) return auth.error

    const body = await request.json().catch(() => ({}))
    const { customerId, name, mobile, email, designation, company, designId, employeeId } = body

    if (!designId) return errorResponse('Please choose a card design.')
    const design = await prisma.cardDesign.findUnique({ where: { id: designId } })
    if (!design) return errorResponse('Invalid card design.')

    const clean = (v?: unknown): string | null =>
      typeof v === 'string' && v.trim() ? v.trim() : null

    let customer: CustomerRecord | null = null

    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: String(customerId) } })
      if (!customer) return errorResponse('Customer not found.')
      if (customer.cardId) {
        return errorResponse('This customer already has a card. Open the builder to customize it instead.')
      }
    } else {
      const cleanedName = clean(name)
      const cleanedMobile = clean(mobile)
      const cleanedEmail = clean(email)
      if (!cleanedName) return errorResponse('Customer name is required.')

      if (cleanedMobile) customer = await prisma.customer.findFirst({ where: { mobile: cleanedMobile } })
      if (!customer && cleanedEmail) customer = await prisma.customer.findFirst({ where: { email: cleanedEmail } })

      if (customer) {
        if (customer.cardId) {
          return errorResponse('A customer with these details already has a card. Open the builder to customize it instead.')
        }
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: cleanedName,
            designation: clean(designation) ?? customer.designation,
            company: clean(company) ?? customer.company,
            mobile: cleanedMobile ?? customer.mobile,
            email: cleanedEmail ?? customer.email,
          },
        })
      } else {
        const tempPassword = await hashPassword(`${cleanedMobile || cleanedName}_mysmartcard_temp`)
        customer = await prisma.customer.create({
          data: {
            name: cleanedName,
            designation: clean(designation),
            company: clean(company),
            mobile: cleanedMobile,
            email: cleanedEmail,
            passwordHash: tempPassword,
          },
        })
      }
    }

    const cardIdNum = await generateUniqueCardId()
    const nfcCardNumber = await generateNfcCardNumber()
    const owner = customer

    const card = await prisma.$transaction(async (tx) => {
      const created = await tx.card.create({
        data: {
          cardId: cardIdNum,
          nfcCardNumber,
          designId: design.id,
          soldByEmployeeId: employeeId || null,
          status: 'Active',
        },
      })
      await tx.cardBuilderConfig.create({ data: { cardId: created.id, status: 'draft' } })
      await tx.customer.update({ where: { id: owner.id }, data: { cardId: created.id } })
      return created
    })

    await logActivity({
      actorId: auth.user!.id,
      actorRole: auth.user!.role,
      action: 'card.create',
      target: card.id,
      metadata: { cardId: card.cardId, customer: owner.name },
    })

    return successResponse({ id: card.id, cardId: card.cardId, nfcCardNumber: card.nfcCardNumber })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create card', 500)
  }
}
