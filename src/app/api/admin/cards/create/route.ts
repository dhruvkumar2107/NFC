import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { generateNfcCardNumber, hashPassword } from '@/lib/auth'
import { emailTaken, findCustomersByContact, generateUniqueCardId } from '@/lib/orders'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logActivity } from '@/lib/admin-log'
import { applyTemplateConfig } from '@/lib/builder'

interface CustomerRecord {
  id: string
  cardId: string | null
  name: string
  designation: string | null
  company: string | null
  mobile: string | null
  email: string | null
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'admin')
    if (auth.error) return auth.error

    const body = await request.json().catch(() => ({}))
    const { customerId, name, mobile, email, designation, company, designId, employeeId, templateId } = body

    if (!designId) return errorResponse('Please choose a card design.')
    const design = await prisma.cardDesign.findUnique({ where: { id: designId } })
    if (!design) return errorResponse('Invalid card design.')

    // Optional starting template; without one the card starts blank.
    const template = templateId ? await prisma.cardTemplate.findUnique({ where: { id: String(templateId) } }) : null
    if (templateId && !template) return errorResponse('Invalid template.')

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

      const matches = await findCustomersByContact(cleanedMobile, cleanedEmail)
      customer = matches.find(c => !c.cardId) || null
      if (!customer && matches.length > 0) {
        return errorResponse(`A customer with these details already has a card (${matches[0].name}${matches[0].card?.cardId ? `, ${matches[0].card.cardId}` : ''}). Open the builder to customize it instead.`)
      }
      const takenBy = await emailTaken(cleanedEmail)
      if (takenBy && takenBy.id !== customer?.id) {
        return errorResponse(`The email ${cleanedEmail} is already used by customer "${takenBy.name}".`)
      }

      if (customer) {
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
      const starter = template ? applyTemplateConfig(template.config) : null
      await tx.cardBuilderConfig.create({
        data: {
          cardId: created.id,
          status: 'draft',
          ...(template && starter
            ? { templateId: template.id, industry: template.industry, theme: JSON.stringify(starter.theme), sections: JSON.stringify(starter.sections) }
            : {}),
        },
      })
      await tx.customer.update({ where: { id: owner.id }, data: { cardId: created.id } })
      return created
    })

    await logActivity({
      actorId: auth.user!.id,
      actorRole: auth.user!.role,
      action: 'card.create',
      target: card.id,
      metadata: { cardId: card.cardId, customer: owner.name, template: template?.name ?? null },
    })

    return successResponse({ id: card.id, cardId: card.cardId, nfcCardNumber: card.nfcCardNumber })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create card', 500)
  }
}
