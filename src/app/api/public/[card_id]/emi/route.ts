import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { calculateEmi, validateEmiInput } from '@/lib/emi'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`emi:${ip}`, 60, 60_000)) return errorResponse('Too many requests', 429)

    const card = await prisma.card.findUnique({
      where: { cardId: params.card_id },
      select: { id: true, builderConfig: { select: { emiEnabled: true, emiConfigId: true } } },
    })
    if (!card) return errorResponse('Card not found', 404)
    if (!card.builderConfig?.emiEnabled) return errorResponse('EMI calculator is not enabled for this business.', 400)

    const body = await request.json().catch(() => ({}))
    const input = {
      price: Number(body.price),
      downPayment: Number(body.downPayment) || 0,
      annualRate: Number(body.annualRate),
      tenureMonths: Number(body.tenureMonths),
      processingFee: Number(body.processingFee) || 0,
    }

    const validation = validateEmiInput(input)
    if (!validation.ok) return errorResponse(validation.errors.join(' '), 400)

    const result = calculateEmi(input)

    await prisma.emiCalculation.create({
      data: {
        cardId: card.id,
        price: result.price,
        downPayment: result.downPayment,
        principal: result.principal,
        rate: result.annualRate,
        tenure: result.tenureMonths,
        emi: result.emi,
        totalInterest: result.totalInterest,
        totalPayable: result.totalPayable,
        processingFee: result.processingFee,
      },
    })

    await recordEvent({
      cardId: card.id,
      type: ANALYTICS_EVENTS.EMI_CALCULATED,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : null,
      userAgent: request.headers.get('user-agent'),
      metadata: { price: result.price, tenure: result.tenureMonths, rate: result.annualRate },
    })

    return successResponse(result)
  } catch (err: any) {
    return errorResponse(err.message || 'EMI calculation failed', 500)
  }
}
