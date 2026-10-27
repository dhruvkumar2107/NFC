import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { generateCardId, generateNfcCardNumber, generateOrderId } from '@/lib/auth'

export const PAID_STATUSES = ['Payment Received', 'Delivered']

// Customer rows can carry megabytes of inline images (photos, logo, QR,
// documents). List endpoints must select only these columns, otherwise the
// response exceeds Vercel's 4.5 MB limit and the admin lists fail to load.
export const CUSTOMER_LIST_SELECT = {
  id: true, name: true, email: true, mobile: true, whatsapp: true, company: true,
  designation: true, city: true, type: true, cardId: true, soldByEmployeeId: true,
  createdAt: true, updatedAt: true,
} satisfies Prisma.CustomerSelect

export const phoneKey =(v?: string | null) => (v || '').replace(/\D/g, '').slice(-10)

type Db = Prisma.TransactionClient | typeof prisma

// Every customer row owns at most one card (Customer.cardId is unique) and the
// card's public profile is read from that row. Customers matching the mobile or
// email are returned newest first so callers can tell "same person retrying a
// checkout" (no card yet) apart from "this person already has a card".
export async function findCustomersByContact(mobile: string | null, email: string | null, db: Db = prisma) {
  const key = phoneKey(mobile)
  const or: Prisma.CustomerWhereInput[] = []
  if (key.length >= 10) or.push({ id: { in: await customerIdsByPhone(key, false, db) } })
  if (email) or.push({ email: { equals: email, mode: 'insensitive' } })
  if (or.length === 0) return []

  return db.customer.findMany({
    where: { OR: or },
    include: { card: { select: { cardId: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

// Numbers are stored as typed ("+91 98111 11111", "098111-11111"), so compare
// the last 10 digits instead of the raw text.
export async function customerIdsByPhone(key: string, includeWhatsapp: boolean, db: Db = prisma) {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Customer"
    WHERE right(regexp_replace(coalesce(mobile, ''), '\\D', '', 'g'), 10) = ${key}
       OR (${includeWhatsapp} AND right(regexp_replace(coalesce(whatsapp, ''), '\\D', '', 'g'), 10) = ${key})`
  return rows.map(r => r.id)
}

export async function emailTaken(email: string | null, db: Db = prisma) {
  if (!email) return null
  return db.customer.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, name: true } })
}

export async function generateUniqueOrderId(db: Db = prisma) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateOrderId()
    const exists = await db.order.findUnique({ where: { orderId: candidate }, select: { id: true } })
    if (!exists) return candidate
  }
  throw new Error('Could not generate a unique order ID. Please try again.')
}

export async function generateUniqueCardId(db: Db = prisma) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateCardId()
    const exists = await db.card.findUnique({ where: { cardId: candidate }, select: { id: true } })
    if (!exists) return candidate
  }
  throw new Error('Could not generate a unique card ID. Please try again.')
}

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'

// Retries a transaction that lost a race on a generated unique value (order ID,
// card ID or NFC number) with a concurrent request.
export async function withUniqueRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i >= attempts || !isUniqueViolation(err)) throw err
    }
  }
}

const PROFILE_FIELDS = [
  'name', 'designation', 'company', 'college', 'mobile', 'whatsapp', 'website', 'socialLinks',
  'address', 'city', 'taluk', 'state', 'pincode', 'country', 'upiId', 'photos', 'paymentQrUrl',
  'logoUrl', 'description', 'type', 'soldByEmployeeId', 'passwordHash',
] as const

export interface FulfillResult {
  alreadyProcessed: boolean
  orderId: string
  cardId: string | null
  nfcCardNumber: string | null
  amount: number
  status: string
  designName: string
  customerName: string
  customerMobile: string
}

// Marks a paid order as confirmed and issues its card exactly once. The browser
// verify call and the Razorpay webhook can arrive at the same time: the
// conditional update locks the order row, so only one caller creates the card,
// credits commission and sends the SMS.
export async function fulfillPaidOrder(params: {
  orderDbId: string
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
}): Promise<FulfillResult> {
  return withUniqueRetry(() => prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: params.orderDbId, cardId: null, status: { notIn: PAID_STATUSES } },
      data: { status: 'Payment Received' },
    })

    const order = await tx.order.findUnique({
      where: { id: params.orderDbId },
      include: { card: true, customer: true, design: true },
    })
    if (!order) throw new Error('Order not found')

    if (claimed.count === 0) {
      return {
        alreadyProcessed: true,
        orderId: order.orderId,
        cardId: order.card?.cardId || null,
        nfcCardNumber: order.card?.nfcCardNumber || null,
        amount: order.amount,
        status: order.status,
        designName: order.design?.name || '',
        customerName: order.customer?.name || '',
        customerMobile: order.customer?.mobile || '',
      }
    }

    // A customer row can only hold one card. If this customer already got a
    // card from another paid order, give this card its own customer record
    // instead of moving the link (which would orphan the earlier card).
    let customerId = order.customerId
    if (order.customer && order.customer.cardId) {
      const source = order.customer as Record<string, any>
      const copy: Record<string, any> = {}
      for (const field of PROFILE_FIELDS) copy[field] = source[field]
      const clone = await tx.customer.create({ data: copy as Prisma.CustomerUncheckedCreateInput })
      customerId = clone.id
    }

    const card = await tx.card.create({
      data: {
        cardId: await generateUniqueCardId(tx),
        nfcCardNumber: await generateNfcCardNumber(),
        orderId: order.id,
        soldByEmployeeId: order.employeeId,
        designId: order.designId,
        status: 'Pending',
      },
    })

    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          cardId: card.id,
          ...(order.employeeId ? { soldByEmployeeId: order.employeeId } : {}),
        },
      })
    }

    const commissionPoints = order.commissionPoints > 0 ? order.commissionPoints : (order.employeeId ? 100 : 0)
    const commissionAmount = (order.commissionAmount && order.commissionAmount > 0) ? order.commissionAmount : (order.employeeId ? 100 : 0)

    await tx.order.update({
      where: { id: order.id },
      data: {
        cardId: card.id,
        customerId,
        commissionPoints,
        commissionAmount,
        razorpayPaymentId: params.razorpayPaymentId || order.razorpayPaymentId || null,
        razorpayPaymentLinkId: params.razorpayOrderId || order.razorpayPaymentLinkId || null,
      },
    })

    if (order.employeeId && commissionPoints > 0) {
      await tx.employee.update({
        where: { id: order.employeeId },
        data: {
          totalPoints: { increment: commissionPoints },
          availablePoints: { increment: commissionPoints },
        },
      })
      await tx.walletTransaction.create({
        data: {
          employeeId: order.employeeId,
          orderId: order.id,
          type: 'commission_earned',
          points: commissionPoints,
          description: `Commission for order ${order.orderId}: ${commissionPoints} points (₹${commissionAmount})`,
        },
      })
    }

    return {
      alreadyProcessed: false,
      orderId: order.orderId,
      cardId: card.cardId,
      nfcCardNumber: card.nfcCardNumber,
      amount: order.amount,
      status: 'Payment Received',
      designName: order.design?.name || '',
      customerName: order.customer?.name || '',
      customerMobile: order.customer?.mobile || '',
    }
  }, { timeout: 20000, maxWait: 10000 }))
}
