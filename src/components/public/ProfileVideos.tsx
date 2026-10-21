"use client"

import { useState } from 'react'
import { formatFileSize } from '@/lib/profile-media'

export interface ProfileVideoItem {
  name: string
  size: number
  mime: string
  viewUrl: string
  downloadUrl: string
}

interface Props {
  videos: ProfileVideoItem[]
  name: string
  onTrack?: (type: string, meta?: Record<string, unknown>) => void
}

export default function ProfileVideos({ videos, name, onTrack }: Props) {
  const [active, setActive] = useState<number | null>(null)

  if (!videos || videos.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Videos <span className="normal-case font-normal">({videos.length})</span>
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {videos.map((video, i) => (
          <div key={`${video.viewUrl}-${i}`} className="glass-subtle overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => { setActive(i); onTrack?.('video_open', { index: i }) }}
              className="block w-full focus:outline-none focus:ring-2 focus:ring-primary-400"
              aria-label={`Play ${video.name}`}
            >
              <video
                src={video.viewUrl}
                preload="metadata"
                muted
                playsInline
                controls={false}
                className="aspect-video w-full bg-gray-900 object-cover"
              />
            </button>
            <div className="flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-700" title={video.name}>{video.name}</p>
                <p className="text-[11px] text-gray-400">{formatFileSize(video.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setActive(i); onTrack?.('video_open', { index: i }) }}
                className="flex-shrink-0 rounded-lg bg-primary-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Play
              </button>
              <a
                href={video.downloadUrl}
                download
                onClick={() => onTrack?.('video_download', { index: i })}
                className="flex-shrink-0 rounded-lg border border-gray-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-white"
              >
                Save
              </a>
            </div>
          </div>
        ))}
      </div>

      {active !== null && videos[active] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-full w-full max-w-2xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <video
              src={videos[active].viewUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] w-full rounded-xl bg-black"
            />
            <div className="flex items-center gap-2">
              <a href={videos[active].downloadUrl} download className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100">
                Download
              </a>
              <button type="button" onClick={() => setActive(null)} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
