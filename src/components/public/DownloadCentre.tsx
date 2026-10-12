"use client"

import { useEffect, useState } from 'react'

interface DownloadManifest {
  cardId: string
  name: string
  counts: {
    photos: number
    albums: number
    documents: number
    catalogues: number
    priceLists: number
    brochures: number
    qrCodes: number
    products: number
  }
  totalSize: number
  available: {
    profilePdf: boolean
    contact: boolean
    photos: boolean
    documents: boolean
    catalogues: boolean
    priceLists: boolean
    brochures: boolean
    paymentQr: boolean
  }
  albums: { id: string; name: string; count: number }[]
}

interface Props {
  cardId: string
  name?: string
  onTrack?: (event: string, metadata?: Record<string, unknown>) => void
}

interface Tile {
  id: string
  label: string
  hint: string
  url: string
  accent: string
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || ''}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function DownloadCentre({ cardId, name, onTrack }: Props) {
  const [manifest, setManifest] = useState<DownloadManifest | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const base = `/api/public/${encodeURIComponent(cardId)}`

  useEffect(() => {
    let active = true
    fetch(`${base}/manifest`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (active && data) setManifest(data) })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [base])

  function trigger(id: string, url: string) {
    setLoadingId(id)
    onTrack?.('zip_download', { via: id })
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    setTimeout(() => anchor.remove(), 1000)
    // Downloads stream in the background; clear the visual state shortly after.
    setTimeout(() => setLoadingId((current) => (current === id ? null : current)), 9000)
  }

  const counts = manifest?.counts
  const available = manifest?.available

  const tiles: Tile[] = []
  if (!manifest || available?.profilePdf) {
    tiles.push({ id: 'pdf', label: 'Business Profile', hint: 'PDF brochure', url: `${base}/profile-pdf`, accent: 'bg-red-500/10 text-red-600' })
  }
  if (!manifest || available?.contact) {
    tiles.push({ id: 'vcf', label: 'Contact Card', hint: '.vcf file', url: `${base}/vcard?download=1`, accent: 'bg-blue-500/10 text-blue-600' })
  }
  if (available?.photos && counts) {
    tiles.push({ id: 'photos', label: 'All Photos', hint: `${counts.photos} photos`, url: `${base}/download?type=photos`, accent: 'bg-emerald-500/10 text-emerald-600' })
  }
  if (available?.documents && counts) {
    tiles.push({ id: 'documents', label: 'Documents', hint: `${counts.documents} file(s)`, url: `${base}/download?type=documents`, accent: 'bg-amber-500/10 text-amber-600' })
  }
  if (available?.catalogues && counts) {
    tiles.push({ id: 'catalogues', label: 'Catalogues', hint: `${counts.catalogues} file(s)`, url: `${base}/download?type=catalogues`, accent: 'bg-violet-500/10 text-violet-600' })
  }
  if (available?.priceLists && counts) {
    tiles.push({ id: 'price_list', label: 'Price List', hint: `${counts.priceLists} file(s)`, url: `${base}/download?type=price_list`, accent: 'bg-cyan-500/10 text-cyan-600' })
  }
  if (available?.brochures && counts) {
    tiles.push({ id: 'brochure', label: 'Brochures', hint: `${counts.brochures} file(s)`, url: `${base}/download?type=brochure`, accent: 'bg-fuchsia-500/10 text-fuchsia-600' })
  }
  if (available?.paymentQr) {
    tiles.push({ id: 'qr', label: 'Payment QR', hint: 'Image', url: `${base}/download?type=qr`, accent: 'bg-slate-500/10 text-slate-600' })
  }

  const everythingBusy = loadingId === 'everything'
  const totalLabel = manifest && manifest.totalSize > 0 ? `· approx ${formatSize(manifest.totalSize)}` : ''

  return (
    <div id="msc-downloads" className="glass-subtle scroll-mt-4 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Download Centre</p>
        {manifest && <span className="text-[11px] text-gray-400">{totalLabel}</span>}
      </div>

      <button
        type="button"
        onClick={() => trigger('everything', `${base}/download?type=everything`)}
        disabled={everythingBusy}
        className="group mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-700 disabled:opacity-70"
      >
        {everythingBusy ? <Spinner className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
        {everythingBusy ? 'Preparing your download…' : 'Download Everything'}
      </button>
      <p className="mb-4 text-center text-[11px] leading-relaxed text-gray-400">
        Business profile PDF, contact file and every photo & document in one ZIP{name ? ` from ${name}` : ''}.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((tile) => {
          const busy = loadingId === tile.id
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => trigger(tile.id, tile.url)}
              disabled={busy}
              className="glass group flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-300 hover:shadow-md disabled:opacity-70"
            >
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${tile.accent}`}>
                {busy ? <Spinner className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-700">{tile.label}</span>
                <span className="block truncate text-[11px] text-gray-400">{busy ? 'Preparing…' : tile.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      {manifest && manifest.albums.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Albums</p>
          <div className="space-y-2">
            {manifest.albums.map((album) => {
              const id = `album:${album.id}`
              const busy = loadingId === id
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => trigger(id, `${base}/download?type=album&albumId=${encodeURIComponent(album.id)}`)}
                  disabled={busy}
                  className="glass flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-300 hover:shadow-sm disabled:opacity-70"
                >
                  <span className="min-w-0 truncate text-sm text-gray-700">{album.name}</span>
                  <span className="flex flex-shrink-0 items-center gap-2 text-[11px] text-gray-400">
                    {album.count} photo{album.count === 1 ? '' : 's'}
                    {busy ? <Spinner className="h-3.5 w-3.5" /> : <DownloadIcon className="h-3.5 w-3.5" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {failed && (
        <p className="mt-3 text-center text-[11px] text-amber-600">
          Could not load the file list. You can still use “Download Everything”.
        </p>
      )}
    </div>
  )
}
