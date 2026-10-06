import { notFound } from 'next/navigation'
import PublicProfile from '@/components/public/PublicProfile'
import { loadProfileByNfc, buildPublicMedia } from '@/lib/public-profile'

export const dynamic = 'force-dynamic'

export default async function NfcCardProfilePage({ params }: { params: { nfcCardNumber: string } }) {
  const profile = await loadProfileByNfc(params.nfcCardNumber)
  if (!profile) notFound()

  const { card, customer } = profile
  const media = buildPublicMedia(card.cardId, customer)

  return (
    <PublicProfile
      card={{ cardId: card.cardId, nfcCardNumber: card.nfcCardNumber }}
      customer={customer}
      profilePath={card.nfcCardNumber ? `/card/${card.nfcCardNumber}` : `/p/${card.cardId}`}
      photos={media.photos}
      documents={media.documents}
    />
  )
}
