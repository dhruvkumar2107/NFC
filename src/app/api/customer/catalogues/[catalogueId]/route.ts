import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

async function loadCatalogue(catalogueId: string, customerId: string) {
  return prisma.catalogueDocument.findFirst({
    where: { id: catalogueId, config: { card: { customer: { id: customerId } } } },
    include: { config: { select: { cardId: true } } },
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { catalogueId: string } }
) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const catalogue = await loadCatalogue(params.catalogueId, user!.id)
  if (!catalogue) return notFound('Catalogue not found')

  await prisma.catalogueDocument.delete({ where: { id: params.catalogueId } })

  await logActivity({
    actorId: user!.id,
    actorRole: user!.role,
    action: 'catalogue.delete',
    target: params.catalogueId,
  })

  return successResponse({ success: true })
}