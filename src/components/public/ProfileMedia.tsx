"use client"

import { useEffect, useState } from 'react'
import { formatFileSize } from '@/lib/profile-media'

export interface ProfilePhotoItem {
  url: string
  source: 'user' | 'admin'
}

export interface ProfileDocumentItem {
  name: string
  size: number
  viewUrl: string
  downloadUrl: string
}

interface ProfileMediaProps {
  cardId: string
  name: string
  photos: ProfilePhotoItem[]
  documents: ProfileDocumentItem[]
}

async function triggerDownload(url: string, filename: string, useAuth = false) {
  try {
    const token = useAuth ? (typeof window !== 'undefined' ? localStorage.getItem('token') : null) : null
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error('Download failed')
    
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const filenameMatch = disposition.match(/filename="(.+)"/)
    const finalFilename = filenameMatch ? filenameMatch[1] : filename
    
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = finalFilename
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error('Download failed:', err)
    // Fallback: open in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export default function ProfileMedia({ cardId, name, photos, documents }: ProfileMediaProps) {
  const [active, setActive] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  function getPhotoFilename(photo: ProfilePhotoItem, index: number): string {
    try {
      const url = new URL(photo.url, window.location.origin)
      const pathname = url.pathname
      const ext = pathname.split('.').pop() || 'jpg'
      return `${name.replace(/[^a-zA-Z0-9]/g, '_')}-photo-${index + 1}.${ext}`
    } catch {
      return `${name.replace(/[^a-zA-Z0-9]/g, '_')}-photo-${index + 1}.jpg`
    }
  }

  if (photos.length === 0 && documents.length === 0) return null

  const basePath = `/api/profile/${encodeURIComponent(cardId)}`

  return (
    <div className="mt-4 space-y-4">
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Photos <span className="normal-case font-normal">({photos.length})</span>
            </p>
            <a
              href={`${basePath}/download?type=photos`}
              className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              Download All Photos
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={`${photo.url}-${i}`} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className="w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-400"
                  aria-label={`View ${name} photo ${i + 1}`}
                >
                  <img
                    src={photo.url}
                    alt={`${name} photo ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover object-center"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDownloading(`photo-${i}`)
                    triggerDownload(photo.url, getPhotoFilename(photo, i))
                    setTimeout(() => setDownloading(null), 1000)
                  }}
                  disabled={downloading === `photo-${i}`}
                  title="Download this photo"
                  className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/85 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {downloading === `photo-${i}` ? 'Saving...' : 'Save'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
            Documents <span className="normal-case font-normal">({documents.length})</span>
          </p>
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div key={`${doc.viewUrl}-${i}`} className="glass-subtle rounded-2xl p-3 flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-700 break-all">{doc.name}</p>
                  <p className="text-[11px] text-gray-400">{formatFileSize(doc.size)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                  <a
                    href={doc.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white/80 border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setDownloading(`doc-${i}`)
                      triggerDownload(doc.downloadUrl, doc.name, true)
                      setTimeout(() => setDownloading(null), 1000)
                    }}
                    disabled={downloading === `doc-${i}`}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {downloading === `doc-${i}` ? 'Saving...' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={`${basePath}/download?type=all`}
        className="flex items-center justify-center gap-2 w-full p-3.5 glass rounded-2xl hover:shadow-md transition-all duration-300 group"
      >
        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-700">Download All (photos + documents)</span>
      </a>

      {active !== null && photos[active] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-full max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[active].url}
              alt={`${name} photo ${active + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-xl"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerDownload(photos[active].url, getPhotoFilename(photos[active], active))
                }}
                className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/25 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
