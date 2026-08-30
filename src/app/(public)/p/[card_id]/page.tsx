import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ShareButton from './ShareButton'

export const dynamic = 'force-dynamic'

async function getProfile(cardId: string) {
  try {
    const card = await prisma.card.findUnique({
      where: { cardId },
      include: { design: true },
    })
    if (!card) return null

    const customer = await prisma.customer.findUnique({
      where: { cardId: card.id },
    })
    if (!customer) return null

    return { card, customer, design: card.design }
  } catch {
    return null
  }
}

function SocialIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    instagram: '📷',
    facebook: '📘',
    linkedin: '💼',
    twitter: '🐦',
    youtube: '▶️',
  }
  return <span>{icons[type] || '🔗'}</span>
}

export default async function PublicProfilePage({ params }: { params: { card_id: string } }) {
  const profile = await getProfile(params.card_id)
  if (!profile) notFound()

  const { card, customer, design } = profile
  let socialLinks: Record<string, string> = {}
  try { socialLinks = JSON.parse(customer.socialLinks || '{}') } catch { socialLinks = {} }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white">
            {customer.profilePhotoUrl ? (
              <img src={customer.profilePhotoUrl} alt={customer.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/20" />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-white/20 flex items-center justify-center text-3xl font-bold">
                {customer.name?.charAt(0) || '?'}
              </div>
            )}
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            {customer.designation && <p className="text-primary-100 mt-1">{customer.designation}</p>}
            {customer.company && <p className="text-primary-200 text-sm mt-1">{customer.company}</p>}
            {design && <p className="text-primary-300 text-xs mt-2">{design.name} Card</p>}
          </div>

          <div className="p-4 grid grid-cols-3 gap-3">
            {customer.mobile && (
              <a href={`tel:${customer.mobile}`} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                <span className="text-xl">📞</span>
                <span className="text-xs font-medium">Call</span>
              </a>
            )}
            {customer.whatsapp && (
              <a href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                <span className="text-xl">💬</span>
                <span className="text-xs font-medium">WhatsApp</span>
              </a>
            )}
            <a href={`/api/vcard/${card.cardId}`} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              <span className="text-xl">💾</span>
              <span className="text-xs font-medium">Save Contact</span>
            </a>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-gray-400">✉️</span>
                <span className="text-gray-700">{customer.email}</span>
              </a>
            )}
            {customer.website && (
              <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-gray-400">🌐</span>
                <span className="text-gray-700">{customer.website}</span>
              </a>
            )}
            {customer.location && (
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-gray-400">📍</span>
                <span className="text-gray-700">{customer.location}</span>
              </div>
            )}

            {Object.entries(socialLinks).map(([platform, url]) => (
              <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <SocialIcon type={platform} />
                <span className="text-gray-700 capitalize">{platform}</span>
              </a>
            ))}

            {customer.description && (
              <div className="p-3 rounded-lg bg-gray-50 mt-4">
                <p className="text-sm text-gray-600">{customer.description}</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <ShareButton name={customer.name || 'Profile'} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by MySmartCard.net
        </p>
      </div>
    </div>
  )
}
