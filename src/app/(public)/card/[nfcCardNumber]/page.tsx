import { cardProfilePath } from '@/lib/card-url'
import { notFound } from 'next/navigation'
import PublicProfile from '@/components/public/PublicProfile'
import { loadProfileByNfc, buildPublicMedia } from '@/lib/public-profile'
import { loadPublicProfileConfig } from '@/lib/card-data'

export const dynamic = 'force-dynamic'

export default async function NfcCardProfilePage({ params }: { params: { nfcCardNumber: string } }) {
  const profile = await loadProfileByNfc(params.nfcCardNumber)
  if (!profile) notFound()

  const { card, customer } = profile
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
