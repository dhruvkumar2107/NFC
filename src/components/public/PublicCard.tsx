"use client"

import { useMemo, useState } from 'react'
import ShareButton from './ShareButton'
import ProfileMedia, { ProfilePhotoItem, ProfileDocumentItem } from './ProfileMedia'
import ProfileVideos, { ProfileVideoItem } from './ProfileVideos'
import EmiOptionsCard from './EmiOptionsCard'
import EnquiryForm, { EnquiryPrefill } from './EnquiryForm'
import AlbumGallery from './AlbumGallery'
import ProductCatalog from './ProductCatalog'
import CatalogueList from './CatalogueList'
import DownloadCentre from './DownloadCentre'
import { useCardAnalytics } from '@/lib/use-analytics'
import { getSocialDisplay, getSocialUrl } from '@/lib/social'
import { FONT_CLASS } from '@/lib/builder'
import type { PublicBuilderData, PublicEmiConfig, PublicProduct } from '@/lib/card-data'

export interface SerializableProfile {
  name: string
  designation: string | null
  company: string | null
  college: string | null
  email: string | null
  mobile: string | null
  whatsapp: string | null
  website: string | null
  socialLinks: Record<string, string>
  logoUrl: string | null
  coverImage?: string | null
  description: string | null
  address: string | null
  taluk: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string | null
  paymentQrUrl: string | null
}

interface Props {
  card: { cardId: string; nfcCardNumber?: string | null }
  profile: SerializableProfile
  profileUrl: string
  photos: ProfilePhotoItem[]
  documents: ProfileDocumentItem[]
  videos?: ProfileVideoItem[]
  builder: PublicBuilderData | null
  /** Set only when the admin has enabled EMI for this card. */
  emi?: PublicEmiConfig | null
}

function SocialIcon({ platform }: { platform: string }) {
  if (platform === 'instagram') return <svg className="h-4 w-4 flex-shrink-0 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
  if (platform === 'facebook') return <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
  if (platform === 'linkedin') return <svg className="h-4 w-4 flex-shrink-0 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
  if (platform === 'twitter') return <svg className="h-4 w-4 flex-shrink-0 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
  if (platform === 'youtube') return <svg className="h-4 w-4 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
  return <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
}

function TextBlock({ value }: { value: string }) {
  const lines = value.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) return <p className="text-sm text-gray-600 whitespace-pre-line">{value}</p>
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-600"><span className="text-primary-500">•</span><span>{line}</span></li>
      ))}
    </ul>
  )
}

export default function PublicCard({ card, profile, profileUrl, photos, documents, videos = [], builder, emi = null }: Props) {
  const track = useCardAnalytics(card.cardId)
  const [prefill, setPrefill] = useState<EnquiryPrefill | undefined>()
  const [copied, setCopied] = useState(false)

  const theme = builder?.theme
  const headerStyle = theme?.headerStyle || 'gradient'
  const primary = theme?.primary || '#4c6ef5'
  const secondary = theme?.secondary || '#3b5bdb'
  const fontClass = theme ? FONT_CLASS[theme.font] : 'font-sans'

  const headerBackground = useMemo(() => {
    if (headerStyle === 'solid') return primary
    if (headerStyle === 'glass') return `linear-gradient(135deg, ${primary}cc, ${secondary}cc)`
    return `linear-gradient(135deg, ${primary}, ${secondary})`
  }, [headerStyle, primary, secondary])

  const heroImage = builder?.profileImage || profile.logoUrl || photos[0]?.url
  const fullAddress = [profile.address, profile.taluk, profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')
  const contactMessage = `Hello ${profile.name}, I got your details by tapping your MySmartCard. I would like to connect with you.`

  function scrollToEnquiry(data?: Record<string, any>, source = 'card', subject?: string, productId?: string) {
    setPrefill({ token: Date.now(), source, subject, productId, emiData: data })
    setTimeout(() => document.getElementById('msc-enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function enquireProduct(product: PublicProduct) {
    scrollToEnquiry(undefined, 'product', `Enquiry about ${product.name}`, product.id)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      track('share', { via: 'copy' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const sections = builder?.sections
  const sectionOrder = sections?.order || []
  const enabled = sections?.enabled || {}
  const titles = sections?.titles || {}
  const fields = sections?.fields || {}

  function sectionTitle(key: string) {
    return titles[key] || ''
  }

  // The legacy default section title reads as a tool name; the profile card is labelled "EMI Options".
  const emiTitle = titles.emi && titles.emi !== 'EMI Calculator' ? titles.emi : 'EMI Options'

  function renderEmi() {
    if (!emi) return null
    return (
      <EmiOptionsCard cardId={card.cardId} config={emi} title={emiTitle} whatsapp={profile.whatsapp}
        onEnquire={enabled.enquiry ? (data) => scrollToEnquiry(data, 'emi', 'Finance quote request') : undefined} />
    )
  }

  function renderSection(key: string) {
    // EMI visibility is controlled solely by the admin EMI toggle; the section list only sets its position.
    if (key !== 'emi' && !enabled[key]) return null
    switch (key) {
      case 'about': {
        const body = fields.about
        if (!body) return null
        return (
          <div className="glass-subtle rounded-2xl p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle('about')}</p>
            <TextBlock value={body} />
          </div>
        )
      }
      case 'offers': {
        const offers = (sections?.offers || []).filter((o) => o.active !== false)
        if (offers.length === 0) return null
        return (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle('offers')}</p>
            {offers.map((o, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-primary-100 bg-primary-50/60">
                {o.image && <img src={o.image} alt={o.title} className="h-28 w-full object-cover" />}
                <div className="p-3">
                  <p className="text-sm font-bold text-primary-700">{o.title}</p>
                  {o.body && <p className="mt-0.5 text-xs text-gray-600 whitespace-pre-line">{o.body}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'gallery': {
        if ((builder?.albums.length || 0) === 0 && photos.length === 0 && documents.length === 0 && videos.length === 0) return null
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle('gallery')}</p>
            {builder && builder.albums.length > 0 && (
              <AlbumGallery cardId={card.cardId} albums={builder.albums} name={profile.name} onTrack={track} />
            )}
            <ProfileMedia cardId={card.cardId} name={profile.name || 'Profile'} photos={photos} documents={documents} />
            <ProfileVideos videos={videos} name={profile.name || 'Profile'} onTrack={track} />
          </div>
        )
      }
      case 'menu':
      case 'products':
      case 'priceList': {
        if (!builder || builder.products.length === 0) return null
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle(key)}</p>
            <ProductCatalog
              products={builder.products}
              categories={builder.categories}
              mode={key === 'products' ? 'products' : 'priceList'}
              whatsapp={profile.whatsapp}
              onEnquire={key === 'products' ? enquireProduct : undefined}
            />
          </div>
        )
      }
      case 'catalogues': {
        if (!builder || builder.catalogues.length === 0) return null
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle('catalogues')}</p>
            <CatalogueList catalogues={builder.catalogues} />
          </div>
        )
      }
      case 'emi':
        return renderEmi()
      case 'hours':
      case 'team':
      case 'schedule':
      case 'amenities': {
        const body = fields[key]
        if (!body) return null
        return (
          <div className="glass-subtle rounded-2xl p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle(key)}</p>
            <TextBlock value={body} />
          </div>
        )
      }
      case 'enquiry':
        return (
          <div id="msc-enquiry" className="space-y-3 scroll-mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle('enquiry')}</p>
            <EnquiryForm cardId={card.cardId} title={sectionTitle('enquiry')} prefill={prefill} />
          </div>
        )
      case 'payment':
        return profile.paymentQrUrl ? (
          <div className="glass-subtle rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{sectionTitle('payment')}</p>
            <img src={profile.paymentQrUrl} alt="Payment QR" className="mt-2 h-28 w-28 rounded-xl border border-gray-100 bg-white object-contain" />
            <p className="mt-2 text-[11px] text-gray-400">Scan to pay</p>
          </div>
        ) : null
      default: {
        const custom = sections?.custom.find((c) => c.key === key)
        if (custom) {
          return (
            <div className="glass-subtle rounded-2xl p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{custom.title}</p>
              <TextBlock value={custom.body} />
            </div>
          )
        }
        return null
      }
    }
  }

  return (
    <div className={`min-h-screen gradient-mesh flex items-center justify-center p-4 ${fontClass}`}>
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass-strong overflow-hidden rounded-3xl shadow-2xl shadow-black/5">
          {/* Profile Header */}
          <div className="relative overflow-hidden p-8 text-center text-white" style={{ background: headerBackground }}>
            {builder?.coverImage && (
              <img src={builder.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="relative z-10">
              <div className="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full bg-white/15 shadow-xl ring-4 ring-white/20 sm:h-48 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64">
                {heroImage ? (
                  <img src={heroImage} alt={profile.name} className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/20 text-7xl font-bold">{profile.name?.charAt(0) || '?'}</div>
                )}
              </div>
              <h1 className="clamp-2 break-words text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">{profile.name}</h1>
              {(profile.designation || profile.company) && (
                <div className="mt-2 space-y-1 text-sm text-white/80">
                  {profile.designation && <p>{profile.designation}</p>}
                  {profile.company && <p>{profile.company}</p>}
                  {profile.college && !profile.company && <p>{profile.college}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 p-5">
            {profile.mobile && (
              <a href={`tel:${profile.mobile}`} onClick={() => track('call_click')} className="glass group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">Call</span>
              </a>
            )}
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(contactMessage)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click')} className="glass group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-12 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">WhatsApp</span>
              </a>
            )}
            {(profile.mobile ?? profile.whatsapp) && (
              <a href={`/api/vcard/${card.cardId}`} onClick={() => track('contact_download', { via: 'save_contact' })} className="glass group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 15h6m-1.5 3h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5z" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">Save Contact</span>
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2 px-5 pb-5">
            <a href={`/api/vcard/${card.cardId}?download=1`} onClick={() => track('contact_download', { via: 'file' })} className="glass group flex w-full items-center justify-center gap-2 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </div>
              <span className="text-sm font-semibold text-gray-600">Download Contact File</span>
            </a>
            <button type="button" onClick={copyLink} className="glass group flex w-full items-center justify-center gap-2 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 transition-colors group-hover:bg-primary-500/20">
                <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </div>
              <span className="text-sm font-semibold text-gray-600">{copied ? 'Link Copied!' : 'Copy Profile Link'}</span>
            </button>
          </div>

          {/* Download Centre */}
          <div className="px-5 pb-5">
            <DownloadCentre cardId={card.cardId} name={profile.name || 'this card'} onTrack={track} />
          </div>

          {/* Contact Details */}
          <div className="space-y-2 px-5 pb-5">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="glass-subtle group flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-sm">
                <svg className="h-4 w-4 flex-shrink-0 text-gray-400 transition-colors group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                <span className="text-sm text-gray-700">{profile.email}</span>
              </a>
            )}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="glass-subtle group flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-sm">
                <svg className="h-4 w-4 flex-shrink-0 text-gray-400 transition-colors group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                <span className="text-sm text-gray-700">{profile.website}</span>
              </a>
            )}
            {fullAddress && (
              <div className="glass-subtle flex items-center gap-3 rounded-2xl p-3.5">
                <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <span className="text-sm text-gray-700">{fullAddress}</span>
              </div>
            )}
            {Object.entries(profile.socialLinks).filter(([, url]) => url).map(([platform, url]) => (
              <a key={platform} href={getSocialUrl(platform, url as string)} target="_blank" rel="noopener noreferrer" className="glass-subtle group flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-sm">
                <SocialIcon platform={platform} />
                <span className="text-sm text-gray-700">{getSocialDisplay(platform, url as string)}</span>
              </a>
            ))}

            {(!builder || !builder.sections.enabled.payment) && profile.paymentQrUrl && (
              <div className="glass-subtle mt-4 rounded-2xl p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Payment QR</p>
                <img src={profile.paymentQrUrl} alt="Payment QR" className="h-28 w-28 rounded-xl border border-gray-100 bg-white object-contain" />
                <p className="mt-2 text-[11px] text-gray-400">Scan to pay</p>
              </div>
            )}
            {!builder && emi && <div className="mt-4">{renderEmi()}</div>}
            {(!builder || !builder.sections.enabled.gallery) && profile.description && (
              <div className="glass-subtle mt-4 rounded-2xl p-4">
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{profile.description}</p>
              </div>
            )}

            {!builder && (
              <ProfileMedia cardId={card.cardId} name={profile.name || 'Profile'} photos={photos} documents={documents} />
            )}

            {/* Configured sections */}
            <div className="space-y-4 pt-2">
              {sectionOrder.map((key) => {
                const content = renderSection(key)
                return content ? <div key={key}>{content}</div> : null
              })}
            </div>

            {/* Videos live on the customer record, so they show even when the gallery section is off. */}
            {videos.length > 0 && !enabled.gallery && (
              <ProfileVideos videos={videos} name={profile.name || 'Profile'} onTrack={track} />
            )}

            <div className="pt-4 text-center">
              <ShareButton name={profile.name || 'Profile'} />
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-medium tracking-wide text-gray-400/60">Powered by MySmartCard.net</p>
      </div>
    </div>
  )
}
