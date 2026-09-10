import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { generateCardId, generateOrderId, generateNfcCardNumber, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'admin')
    if (auth.error) return auth.error

    const body = await request.json()
    const {
      name, email, mobile, whatsapp, designation, company, college,
      website, address, city, state, pincode,
      socialLinks, logoUrl, paymentQrUrl, description, photos,
      designId, employeeId, amount,
    } = body

    if (!name || !email || !designId) {
      return errorResponse('Name, email, and design are required')
    }

    const design = await prisma.cardDesign.findUnique({ where: { id: designId } })
    if (!design) return errorResponse('Invalid card design')

    let customer = await prisma.customer.findUnique({ where: { email } })
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name, designation, company, college, mobile, whatsapp, website,
          socialLinks: JSON.stringify(socialLinks || {}),
          address, city, state, pincode, logoUrl, paymentQrUrl, description,
          photos: JSON.stringify(photos || []),
        },
      })
    } else {
      const tempPassword = await hashPassword(email + '_mysmartcard_temp')
      customer = await prisma.customer.create({
        data: {
          name, designation, company, college, mobile, whatsapp, email, website,
          socialLinks: JSON.stringify(socialLinks || {}),
          address, city, state, pincode, logoUrl, paymentQrUrl, description,
          photos: JSON.stringify(photos || []),
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
