"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
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

function PhotoThumbnail({ photo, index, name, onClick, onDownload, downloading }: {
  photo: ProfilePhotoItem
  index: number
  name: string
  onClick: () => void
  onDownload: () => void
  downloading: boolean
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setAttempt(0)
  }, [photo.url])

  // Cached images can finish before React attaches onLoad.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setImageLoaded(true)
  }, [attempt, photo.url])

  const handleImageError = useCallback(() => {
    setImageLoaded(false)
    if (attempt < 2) {
      window.setTimeout(() => setAttempt((current) => current + 1), 400 * (attempt + 1))
    } else {
      setImageError(true)
    }
  }, [attempt])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  const src = attempt === 0 ? photo.url : `${photo.url}${photo.url.includes('?') ? '&' : '?'}retry=${attempt}`

  return (
    <div className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
      <button
        type="button"
        onClick={onClick}
        className="w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-400"
        aria-label={`View ${name} photo ${index + 1}`}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-600 p-4">
            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium">Tap to retry</span>
          </div>
        )}
        <img
          ref={imgRef}
          src={src}
          alt={`${name} photo ${index + 1}`}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover object-center transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        title="Download this photo"
        className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/85 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {downloading ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

function PhotoModal({ photo, index, name, onClose, onDownload }: {
  photo: ProfilePhotoItem
  index: number
  name: string
  onClose: () => void
  onDownload: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setAttempt(0)
  }, [photo.url])

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setImageLoaded(true)
  }, [attempt, photo.url])

  const handleImageError = useCallback(() => {
    setImageLoaded(false)
    if (attempt < 2) {
      window.setTimeout(() => setAttempt((current) => current + 1), 400 * (attempt + 1))
    } else {
      setImageError(true)
    }
  }, [attempt])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  const src = attempt === 0 ? photo.url : `${photo.url}${photo.url.includes('?') ? '&' : '?'}retry=${attempt}`

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-3 sm:p-4 overscroll-contain"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="max-w-full max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {!imageLoaded && !imageError && (
          <div className="w-[min(92vw,42rem)] aspect-video flex items-center justify-center bg-gray-900 animate-pulse rounded-xl">
            <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageError && (
          <div className="w-[min(92vw,42rem)] aspect-video flex flex-col items-center justify-center bg-gray-900 rounded-xl p-8 text-center text-red-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-lg font-medium mb-2">Failed to load image</p>
            <p className="text-sm">The image could not be loaded. It may have been removed or the link may be expired.</p>
          </div>
        )}
        <img
          ref={imgRef}
          src={src}
          alt={`${name} photo ${index + 1}`}
          decoding="async"
          className={`max-w-[92vw] sm:max-w-[85vw] max-h-[75dvh] sm:max-h-[80dvh] w-auto h-auto object-contain rounded-xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/25 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
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
              <PhotoThumbnail
                key={`${photo.url}-${i}`}
                photo={photo}
                index={i}
                name={name}
                onClick={() => setActive(i)}
                onDownload={() => {
                  setDownloading(`photo-${i}`)
                  triggerDownload(photo.url, getPhotoFilename(photo, i, name))
                  setTimeout(() => setDownloading(null), 1000)
                }}
                downloading={downloading === `photo-${i}`}
              />
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
        <PhotoModal
          photo={photos[active]}
          index={active}
          name={name}
          onClose={() => setActive(null)}
          onDownload={() => {
            const photo = photos[active]
            triggerDownload(photo.url, getPhotoFilename(photo, active, name))
          }}
        />
      )}
    </div>
  )
}

function getPhotoFilename(photo: ProfilePhotoItem, index: number, name: string): string {
  try {
    const url = new URL(photo.url, window.location.origin)
    const rawExt = url.pathname.split('.').pop() || ''
    const ext = /^[a-z0-9]{1,5}$/i.test(rawExt) ? rawExt : 'jpg'
    return `${name.replace(/[^a-zA-Z0-9]/g, '_') || 'profile'}-photo-${index + 1}.${ext}`
  } catch {
    return `${name.replace(/[^a-zA-Z0-9]/g, '_')}-photo-${index + 1}.jpg`
  }
}