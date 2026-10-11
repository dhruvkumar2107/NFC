import { NextRequest } from 'next/server'
import { prisma } from './db'
import { getAuthUser } from './auth-guard'
import { forbidden, notFound } from './api-response'

export interface CardAccess {
  user: { id: string; role: string }
  card: { id: string; cardId: string; status: string }
  isAdmin: boolean
}

/**
 * Authorizes access to a specific card's management data.
 * Admins may access any card; a customer may access only their own card.
 */
export async function authorizeCardAccess(
  request: NextRequest,
  cardUuid: string
): Promise<{ access: CardAccess; error: null } | { access: null; error: Response }> {
  const user = await getAuthUser(request)
  if (!user) return { access: null, error: forbidden('Unauthorized') }

  const card = await prisma.card.findUnique({
    where: { id: cardUuid },
    select: { id: true, cardId: true, status: true },
  })
  if (!card) return { access: null, error: notFound('Card not found') }

  if (user.role === 'admin') {
    return { access: { user, card, isAdmin: true }, error: null }
  }

  if (user.role === 'customer') {
    const customer = await prisma.customer.findUnique({ where: { id: user.id }, select: { cardId: true } })
    if (customer?.cardId === card.id) {
      return { access: { user, card, isAdmin: false }, error: null }
    }
  }

  return { access: null, error: forbidden('You do not have access to this card') }
}
