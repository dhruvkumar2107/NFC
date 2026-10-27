import { cardProfilePath } from '@/lib/card-url'
import { notFound, permanentRedirect } from 'next/navigation'
import PublicProfile from '@/components/public/PublicProfile'
import { loadProfileByCardId, buildPublicMedia } from '@/lib/public-profile'
import { loadPublicProfileConfig } from '@/lib/card-data'

export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }: { params: { card_id: string } }) {
  const profile = await loadProfileByCardId(params.card_id)
  if (!profile) notFound()

  const { card, customer } = profile
  // One link per card: old /p/ links forward to the NFC link.
  if (card.nfcCardNumber) permanentRedirect(cardProfilePath(card))
  const media = buildPublicMedia(card.cardId, customer)
  const { builder, emi } = await loadPublicProfileConfig(card.id)

  return (
    <PublicProfile
      card={{ cardId: card.cardId, nfcCardNumber: card.nfcCardNumber }}
      customer={customer}
      profilePath={cardProfilePath(card)}
      photos={media.photos}
      documents={media.documents}
      videos={media.videos}
      builder={builder}
      emi={emi}
    />
  )
}
