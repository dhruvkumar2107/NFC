"use client"

import { useEffect, useState } from 'react'
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
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                <button type="button" onClick={() => { setActive({ albumIndex: ai, photoIndex: pi }); onTrack?.('gallery_open', { albumId: album.id }) }}
                  className="h-full w-full focus:outline-none focus:ring-2 focus:ring-primary-400">
                  <img src={photo.thumbnailUrl || photo.url} alt={photo.name || `${album.name} photo ${pi + 1}`} loading="lazy"
                    className="h-full w-full object-cover" />
                </button>
                <a href={withDownload(photo.url)} download
                  onClick={() => onTrack?.('image_download', { albumId: album.id })}
                  className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white hover:bg-black/85">
                  Save
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}

      {current && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActive(null)} role="dialog" aria-modal="true">
          <div className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt={current.name || 'Photo'} className="max-h-[70vh] max-w-full rounded-xl object-contain" />
            <div className="flex items-center gap-2">
              <a href={withDownload(current.url)} download className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Download</a>
              <button type="button" onClick={() => move(-1)} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">‹</button>
              <button type="button" onClick={() => move(1)} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">›</button>
              <button type="button" onClick={() => setActive(null)} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
