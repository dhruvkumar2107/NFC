import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCardId, generateOrderId, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import razorpay from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name: rawName, fullName, designation, company, mobile, whatsapp, email, website,
      socialLinks, location, upiId, profilePhotoUrl, logoUrl, description,
      designId, referralCode, attributionType,
    } = body

    const name = rawName || fullName

    if (!name || !email || !designId) {
      return errorResponse('Name, email, and design are required')
    }

    const design = await prisma.cardDesign.findUnique({ where: { id: designId } })
    if (!design) return errorResponse('Invalid card design')

    let employeeId: string | null = null
    let resolvedAttributionType = attributionType || 'direct'
    if (referralCode) {
      const employee = await prisma.employee.findFirst({
        where: { referralLinkCode: referralCode, status: 'active' },
      })
      if (!employee) return errorResponse('Invalid or inactive referral code')
      employeeId = employee.id
      resolvedAttributionType = 'manual_code'
    }

    let customer = await prisma.customer.findUnique({ where: { email } })
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name, designation, company, mobile, whatsapp, website,
          socialLinks: JSON.stringify(socialLinks || {}),
          location, upiId, profilePhotoUrl, logoUrl, description,
          soldByEmployeeId: employeeId || customer.soldByEmployeeId,
        },
      })
    } else {
      const tempPassword = await hashPassword(email + '_mysmartcard_temp')
      customer = await prisma.customer.create({
        data: {
          name, designation, company, mobile, whatsapp, email, website,
          socialLinks: JSON.stringify(socialLinks || {}),
          location, upiId, profilePhotoUrl, logoUrl, description,
          soldByEmployeeId: employeeId,
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
      const employeeOrderCount = await prisma.order.count({
        where: { employeeId, status: { not: 'Cancelled' } },
      })
      const newCount = employeeOrderCount + 1

      for (const rule of activeRules) {
        if (newCount >= rule.minCards && (rule.maxCards === null || newCount <= rule.maxCards)) {
          commissionAmount = rule.commissionPerCard
          commissionPoints = rule.pointsPerCard || rule.commissionPerCard
          break
        }
      }
    }

    const orderId = generateOrderId()
    const order = await prisma.order.create({
      data: {
        orderId,
        customerId: customer.id,
        employeeId,
        designId: design.id,
        amount: design.price,
        commissionAmount,
        commissionPoints,
        attributionType: resolvedAttributionType,
        status: 'Pending',
      },
    })

    let razorpayOrderId: string | null = null
    let razorpayKey: string | null = null

    const isTestMode = (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_')

    if (isTestMode && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret') {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(design.price * 100),
          currency: 'INR',
          receipt: orderId,
        })
        razorpayOrderId = razorpayOrder.id
        razorpayKey = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null)
      } catch (e: any) {
        console.error('Razorpay order creation failed:', e.message)
      }
    }

    return successResponse({
      orderId: order.orderId,
      razorpayOrderId,
      razorpayKey,
      amount: design.price,
      design: design.name,
      customerEmail: email,
      razorpayCheckoutUrl: razorpayOrderId ? null : `/order/success?orderId=${orderId}`,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Order creation failed', 500)
  }
}
