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

export default async function PublicProfilePage({ params }: { params: { card_id: string } }) {
  const profile = await getProfile(params.card_id)
  if (!profile) notFound()

  const { card, customer, design } = profile
  let socialLinks: Record<string, string> = {}
  try { socialLinks = JSON.parse(customer.socialLinks || '{}') } catch { socialLinks = {} }
  let photos: string[] = []
  try { photos = JSON.parse(customer.photos || '[]') } catch { photos = [] }

  const addressParts = [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean)
  const fullAddress = addressParts.join(', ')

  function getSocialUrl(platform: string, value: string): string {
    if (!value) return ''
    const v = value.trim()
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    const username = v.replace(/^@/, '')
    switch (platform) {
      case 'instagram': return `https://instagram.com/${username}`
      case 'facebook': return `https://facebook.com/${username}`
      case 'linkedin': return `https://linkedin.com/in/${username}`
      case 'twitter': return `https://twitter.com/${username}`
      case 'youtube': return `https://youtube.com/@${username}`
      default: return `https://${platform}.com/${username}`
    }
  }

  function getSocialDisplay(platform: string, value: string): string {
    if (!value) return ''
    const v = value.trim()
    if (v.startsWith('http://') || v.startsWith('https://')) {
      try {
        const url = new URL(v)
        const path = url.pathname.replace(/^\/+|\/+$/g, '')
        return path || url.hostname
      } catch { return v }
    }
    return v.startsWith('@') ? v : `@${v}`
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="relative z-10">
              <div className="w-28 h-28 rounded-full mx-auto mb-5 ring-4 ring-white/20 shadow-xl overflow-hidden">
                {customer.logoUrl ? (
                  <img src={customer.logoUrl} alt={customer.name} className="w-full h-full object-cover" />
                ) : photos[0] ? (
                  <img src={photos[0]} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-white/20">
                    {customer.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              {customer.designation && <p className="text-primary-100 mt-1 text-sm">{customer.designation}</p>}
              {customer.company && <p className="text-primary-200 text-sm mt-0.5">{customer.company}</p>}
              {customer.college && <p className="text-primary-200 text-sm mt-0.5">{customer.college}</p>}
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
              <a href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${customer.name}, I found your MySmartCard profile!`)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:shadow-md transition-all duration-300 group">
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
              <a href={`mailto:${customer.email}?subject=${encodeURIComponent(`Contact from MySmartCard Profile`)}&body=${encodeURIComponent(`Hi ${customer.name},\n\nI found your profile on MySmartCard and would like to connect.\n\nBest regards`)}`} className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl hover:shadow-sm transition-all duration-300 group">
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
            {fullAddress && (
              <div className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <span className="text-sm text-gray-700">{fullAddress}</span>
              </div>
            )}
            {/* Social Links */}
            {Object.entries(socialLinks).filter(([, url]) => url).map(([platform, url]) => (
              <a key={platform} href={getSocialUrl(platform, url as string)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 glass-subtle rounded-2xl hover:shadow-sm transition-all duration-300 group">
                {platform === 'instagram' && <svg className="w-4 h-4 text-pink-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>}
                {platform === 'facebook' && <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
                {platform === 'linkedin' && <svg className="w-4 h-4 text-blue-700 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>}
                {platform === 'twitter' && <svg className="w-4 h-4 text-gray-800 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>}
                {platform === 'youtube' && <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>}
                {!['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'].includes(platform) && <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>}
                <span className="text-sm text-gray-700">{getSocialDisplay(platform, url as string)}</span>
              </a>
            ))}

            {/* Description */}
            {customer.description && (
              <div className="p-4 glass-subtle rounded-2xl mt-4">
                <p className="text-sm text-gray-600 leading-relaxed">{customer.description}</p>
              </div>
            )}

            {/* Photos Gallery */}
            {photos.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Photos</p>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="rounded-xl overflow-hidden aspect-square">
                      <img src={photo} alt={`${customer.name} photo ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
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
