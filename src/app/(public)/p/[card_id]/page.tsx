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
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    youtube: 'YouTube',
  }
  return <span>{icons[type] || type}</span>
}

export default async function PublicProfilePage({ params }: { params: { card_id: string } }) {
  const profile = await getProfile(params.card_id)
  if (!profile) notFound()

  const { card, customer, design } = profile
  let socialLinks: Record<string, string> = {}
  try { socialLinks = JSON.parse(customer.socialLinks || '{}') } catch { socialLinks = {} }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="relative z-10">
              <div className="w-28 h-28 rounded-full mx-auto mb-5 ring-4 ring-white/20 shadow-xl overflow-hidden">
                {customer.profilePhotoUrl ? (
                  <img src={customer.profilePhotoUrl} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-white/20">
                    {customer.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              {customer.designation && <p className="text-primary-100 mt-1 text-sm">{customer.designation}</p>}
              {customer.company && <p className="text-primary-200 text-sm mt-0.5">{customer.company}</p>}
              {design && <p className="text-primary-300 text-xs mt-3 font-medium tracking-wide">{design.name} Card</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 grid grid-cols-3 gap-3">
            {customer.mobile && (
              <a href={`tel:${customer.mobile}`} className="flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:shadow-md transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">Call</span>
              </a>
            )}
            {customer.whatsapp && (
              <a href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:shadow-md transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-12 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">WhatsApp</span>
              </a>
            )}
            <a href={`/api/vcard/${card.cardId}`} className="flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <span className="text-xs font-semibold text-gray-600">Save Contact</span>
            </a>
          </div>

          {/* Contact Details */}
          <div className="px-5 pb-5 space-y-2">
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl hover:shadow-sm transition-all duration-300 group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                <span className="text-sm text-gray-700">{customer.email}</span>
              </a>
            )}
            {customer.website && (
              <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl hover:shadow-sm transition-all duration-300 group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                <span className="text-sm text-gray-700">{customer.website}</span>
              </a>
            )}
            {customer.location && (
              <div className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl hover:shadow-sm transition-all duration-300">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <span className="text-sm text-gray-700">{customer.location}</span>
              </div>
            )}

            {/* Social Links */}
            {Object.entries(socialLinks).map(([platform, url]) => (
              <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl hover:shadow-sm transition-all duration-300 group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                <span className="text-sm text-gray-700 capitalize">{platform}</span>
              </a>
            ))}

            {/* Description */}
            {customer.description && (
              <div className="p-4 glass-subtle rounded-2xl mt-4">
                <p className="text-sm text-gray-600 leading-relaxed">{customer.description}</p>
              </div>
            )}

            {/* Share */}
            <div className="pt-4 text-center">
              <ShareButton name={customer.name || 'Profile'} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400/60 mt-5 font-medium tracking-wide">
          Powered by MySmartCard.net
        </p>
      </div>
    </div>
  )
}
