import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { generateCardId, generateOrderId, generateNfcCardNumber, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import {
  MAX_ADMIN_PHOTOS,
  MAX_DOCUMENTS,
  validateAdminPhotoList,
  validateDocumentList,
  isImageValue,
  isPdfValue,
} from '@/lib/profile-media'

function coerceList(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : value
    } catch {
      return value
    }
  }
  return value
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'admin')
    if (auth.error) return auth.error

    const body = await request.json()
    const {
      name, email, mobile, whatsapp, designation, company, college,
      website, address, taluk, city, state, pincode,
      socialLinks, logoUrl, paymentQrUrl, description,
      adminPhotos, documents,
      designId, employeeId, amount,
    } = body

    if (!name || !designId) {
      return errorResponse('Name and design are required')
    }

    if (adminPhotos !== undefined) {
      const check = validateAdminPhotoList(coerceList(adminPhotos))
      if (!check.ok) return errorResponse(check.error, 400)
    }
    if (documents !== undefined) {
      const check = validateDocumentList(coerceList(documents))
      if (!check.ok) return errorResponse(check.error, 400)
    }

    const clean = (v?: string) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    const cleanedMobile = clean(mobile)
    const cleanedEmail = clean(email)

    const design = await prisma.cardDesign.findUnique({ where: { id: designId } })
    if (!design) return errorResponse('Invalid card design')

    let customer = cleanedMobile ? await prisma.customer.findFirst({ where: { mobile: cleanedMobile } }) : null
    if (!customer && cleanedEmail) customer = await prisma.customer.findFirst({ where: { email: cleanedEmail } })
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name, designation: clean(designation), company: clean(company), college: clean(college),
          mobile: cleanedMobile, whatsapp: clean(whatsapp), email: cleanedEmail, website: clean(website),
          socialLinks: JSON.stringify(socialLinks || {}),
          address: clean(address), taluk: clean(taluk), city: clean(city), state: clean(state), pincode: clean(pincode),
          logoUrl: clean(logoUrl), paymentQrUrl: clean(paymentQrUrl), description: clean(description),
          adminPhotos: adminPhotos !== undefined ? JSON.stringify(adminPhotos) : undefined,
          documents: documents !== undefined ? JSON.stringify(documents) : undefined,
        },
      })
    } else {
      const tempPassword = await hashPassword((cleanedMobile || name) + '_mysmartcard_temp')
      customer = await prisma.customer.create({
        data: {
          name, designation: clean(designation), company: clean(company), college: clean(college),
          mobile: cleanedMobile, whatsapp: clean(whatsapp), email: cleanedEmail, website: clean(website),
          socialLinks: JSON.stringify(socialLinks || {}),
          address: clean(address), taluk: clean(taluk), city: clean(city), state: clean(state), pincode: clean(pincode),
          logoUrl: clean(logoUrl), paymentQrUrl: clean(paymentQrUrl), description: clean(description),
          adminPhotos: JSON.stringify(adminPhotos || []),
          documents: JSON.stringify(documents || []),
          soldByEmployeeId: employeeId || null,
          passwordHash: tempPassword,
        },
      })
    }

    let commissionAmount = 0
    let commissionPoints = 0
    if (employeeId) {
      const activeRules = await prisma.commissionRule.findMany({
        where: { active: true },
        orderBy: { minCards: 'asc' },
      })
      if (activeRules.length > 0) {
        commissionAmount = activeRules[0].commissionPerCard
        commissionPoints = activeRules[0].pointsPerCard || activeRules[0].commissionPerCard
      } else {
        commissionAmount = 100
        commissionPoints = 100
      }
    }

    const orderId = generateOrderId()
    const cardIdNum = generateCardId()
    const nfcCardNumber = await generateNfcCardNumber()

    const orderAmount = amount || design.price

    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: {
          cardId: cardIdNum,
          nfcCardNumber,
          soldByEmployeeId: employeeId || null,
          designId: design.id,
          status: 'Pending',
        },
      })

      const order = await tx.order.create({
        data: {
          orderId,
          customerId: customer!.id,
          employeeId: employeeId || null,
          cardId: card.id,
          designId: design.id,
          amount: orderAmount,
          commissionAmount,
          commissionPoints,
          attributionType: employeeId ? 'admin_manual' : 'direct',
          status: 'Payment Received',
        },
      })

      await tx.card.update({
        where: { id: card.id },
        data: { orderId: order.id },
      })

      await tx.customer.update({
        where: { id: customer!.id },
        data: {
          cardId: card.id,
          ...(employeeId ? { soldByEmployeeId: employeeId } : {}),
        },
      })

      if (employeeId && commissionPoints > 0) {
        await tx.employee.update({
          where: { id: employeeId },
          data: {
            totalPoints: { increment: commissionPoints },
            availablePoints: { increment: commissionPoints },
          },
        })
        await tx.walletTransaction.create({
          data: {
            employeeId,
            orderId: order.id,
            type: 'commission_earned',
            points: commissionPoints,
            description: `Commission for admin order ${orderId}: ${commissionPoints} points`,
          },
        })
      }

      return { orderId: order.orderId, cardId: card.cardId, nfcCardNumber: card.nfcCardNumber }
    })

    return successResponse({
      orderId: result.orderId,
      cardId: result.cardId,
      nfcCardNumber: result.nfcCardNumber,
      message: 'Order created successfully with card generated!',
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create order', 500)
  }
}
