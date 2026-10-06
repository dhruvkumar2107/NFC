import { notFound } from 'next/navigation'
import PublicProfile from '@/components/public/PublicProfile'
import { loadProfileByCardId, buildPublicMedia } from '@/lib/public-profile'

export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }: { params: { card_id: string } }) {
  const profile = await loadProfileByCardId(params.card_id)
  if (!profile) notFound()

  const { card, customer } = profile
  const media = buildPublicMedia(card.cardId, customer)

  return (
    <PublicProfile
      card={{ cardId: card.cardId, nfcCardNumber: card.nfcCardNumber }}
      customer={customer}
      profilePath={`/p/${card.cardId}`}
      photos={media.photos}
      documents={media.documents}
    />
  )
}
