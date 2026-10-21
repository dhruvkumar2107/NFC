"use client"

import { useEffect, useState, useCallback } from 'react'
import type { PublicAlbum } from '@/lib/card-data'

interface Props {
  cardId: string
  albums: PublicAlbum[]
  name: string
  onTrack?: (type: string, meta?: Record<string, unknown>) => void
}

function withDownload(url: string): string {
  return url + (url.includes('?') ? '&' : '?') + 'download=1'
}

function PhotoThumbnail({ photo, onClick, onDownload, downloading, onTrack, albumId }: {
  photo: { id: string; url: string; thumbnailUrl?: string | null; name?: string | null; kind: string }
  onClick: () => void
  onDownload: () => void
  downloading: boolean
  onTrack?: (type: string, meta?: Record<string, unknown>) => void
  albumId: string
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageError = useCallback(() => {
    setImageError(true)
    setImageLoaded(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
      <button type="button" onClick={onClick} className="h-full w-full focus:outline-none focus:ring-2 focus:ring-primary-400">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-600 p-4">
            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium">Failed to load</span>
          </div>
        )}
        {photo.kind === 'video' ? (
          <>
            <video src={photo.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">VIDEO</span>
          </>
        ) : (
          <img src={photo.thumbnailUrl || photo.url} alt={photo.name || 'Photo'} loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        )}
      </button>
      <a href={withDownload(photo.url)} download
        onClick={() => onTrack?.('image_download', { albumId })}
        className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white hover:bg-black/85"
      >
        Save
      </a>
    </div>
  )
}

function PhotoModal({ current, onClose, onDownload, onPrev, onNext }: {
  current: { id: string; url: string; name?: string | null; kind: string }
  onClose: () => void
  onDownload: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageError = useCallback(() => {
    setImageError(true)
    setImageLoaded(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {!imageLoaded && !imageError && (
          <div className="w-full max-w-2xl aspect-video flex items-center justify-center bg-gray-900 animate-pulse rounded-xl">
            <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageError && (
          <div className="w-full max-w-2xl aspect-video flex flex-col items-center justify-center bg-gray-900 rounded-xl p-8 text-center text-red-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-lg font-medium mb-2">Failed to load image</p>
            <p className="text-sm">The image could not be loaded. It may have been removed or the link may be expired.</p>
          </div>
        )}
        {current.kind === 'video' ? (
          <video src={current.url} controls autoPlay playsInline className="max-h-[70vh] max-w-full rounded-xl bg-black" />
        ) : (
          <img src={current.url} alt={current.name || 'Photo'} className={`max-h-[70vh] max-w-full rounded-xl object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        )}
        <div className="flex items-center gap-2">
          <a href={withDownload(current.url)} download className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Download</a>
          <button type="button" onClick={onPrev} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">‹</button>
          <button type="button" onClick={onNext} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">›</button>
          <button type="button" onClick={onClose} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function AlbumGallery({ cardId, albums, name, onTrack }: Props) {
  const [active, setActive] = useState<{ albumIndex: number; photoIndex: number } | null>(null)
  const [shareMsg, setShareMsg] = useState('')

  const totalPhotos = albums.reduce((sum, a) => sum + a.photos.length, 0)
  const allDownloadUrl = `/api/public/${encodeURIComponent(cardId)}/gallery-download`

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function move(delta: number) {
    setActive((cur) => {
      if (!cur) return cur
      const album = albums[cur.albumIndex]
      const next = cur.photoIndex + delta
      if (next < 0 || next >= album.photos.length) return cur
      return { ...cur, photoIndex: next }
    })
  }

  async function shareGallery() {
    const url = `${window.location.origin}/p/${encodeURIComponent(cardId)}`
    onTrack?.('share', { section: 'gallery' })
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} Gallery`, text: `View ${name}'s photo gallery`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareMsg('Gallery link copied')
      setTimeout(() => setShareMsg(''), 2000)
    } catch {
      // user cancelled
    }
  }

  if (totalPhotos === 0) return null

  const current = active ? albums[active.albumIndex]?.photos[active.photoIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-gray-400">
          Tap any photo to view. Downloads require a tap on mobile — your browser will save the file.
        </p>
        <button type="button" onClick={shareGallery} className="flex-shrink-0 text-xs font-semibold text-primary-600 hover:text-primary-700">
          Share Gallery
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={`${allDownloadUrl}?catalogues=1`} download
          onClick={() => onTrack?.('zip_download', { scope: 'all' })}
          className="flex-1 min-w-[150px] rounded-xl bg-primary-600 px-3 py-2.5 text-center text-xs font-semibold text-white hover:bg-primary-700">
          Download All Photos (ZIP)
        </a>
      </div>
      {shareMsg && <p className="text-xs text-green-600">{shareMsg}</p>}

      {albums.map((album, ai) => (
        <div key={album.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">{album.name}</p>
              {album.description && <p className="text-xs text-gray-400">{album.description}</p>}
            </div>
            <a href={`${allDownloadUrl}?albumId=${album.id}`} download
              onClick={() => onTrack?.('zip_download', { albumId: album.id })}
              className="text-[11px] font-semibold text-primary-600 hover:underline whitespace-nowrap">
              Download album
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {album.photos.map((photo, pi) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onClick={() => { setActive({ albumIndex: ai, photoIndex: pi }); onTrack?.('gallery_open', { albumId: album.id }) }}
                onDownload={() => {}}
                downloading={false}
                onTrack={onTrack}
                albumId={album.id}
              />
            ))}
          </div>
        </div>
      ))}

      {current && active && (
        <PhotoModal
          current={current}
          onClose={() => setActive(null)}
          onDownload={() => {}}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
        />
      )}
    </div>
  )
}
