import { headers } from 'next/headers'
import PublicCard, { SerializableProfile } from './PublicCard'
import { ProfilePhotoItem, ProfileDocumentItem } from './ProfileMedia'
import { ProfileVideoItem } from './ProfileVideos'
import { PublicBuilderData } from '@/lib/card-data'

interface PublicProfileProps {
  card: { cardId: string; nfcCardNumber?: string | null }
  customer: any
  profilePath: string
  photos: ProfilePhotoItem[]
  documents: ProfileDocumentItem[]
  videos?: ProfileVideoItem[]
  builder?: PublicBuilderData | null
}

function requestOrigin(): string {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    if (host) {
      const proto = h.get('x-forwarded-proto') || 'https'
      return `${proto}://${host}`
    }
  } catch {
    // headers unavailable
  }
  return process.env.NEXT_PUBLIC_BASE_URL || ''
}

export default function PublicProfile({ card, customer, profilePath, photos, documents, videos = [], builder }: PublicProfileProps) {
  let socialLinks: Record<string, string> = {}
  try { socialLinks = JSON.parse(customer.socialLinks || '{}') } catch { socialLinks = {} }

  const origin = requestOrigin()
  const profileUrl = `${origin}${profilePath}`

  const profile: SerializableProfile = {
    name: customer.name,
    designation: customer.designation ?? null,
    company: customer.company ?? null,
    college: customer.college ?? null,
    email: customer.email ?? null,
    mobile: customer.mobile ?? null,
    whatsapp: customer.whatsapp ?? null,
    website: customer.website ?? null,
    socialLinks,
    logoUrl: customer.logoUrl ?? null,
    description: customer.description ?? null,
    address: customer.address ?? null,
    taluk: customer.taluk ?? null,
    city: customer.city ?? null,
    state: customer.state ?? null,
    pincode: customer.pincode ?? null,
    country: customer.country ?? null,
    paymentQrUrl: customer.paymentQrUrl ?? null,
  }

  return (
    <PublicCard
      card={card}
      profile={profile}
      profileUrl={profileUrl}
      photos={photos}
      documents={documents}
      videos={videos}
      builder={builder ?? null}
    />
  )
}
