"use client"

import { formatFileSize } from '@/lib/profile-media'
import type { PublicCatalogue } from '@/lib/card-data'

interface Props {
  catalogues: PublicCatalogue[]
  title?: string
}

const KIND_LABEL: Record<string, string> = {
  catalogue: 'Catalogue',
  price_list: 'Price List',
  brochure: 'Brochure',
  menu: 'Menu',
}

export default function CatalogueList({ catalogues, title }: Props) {
  if (catalogues.length === 0) return null

  return (
    <div className="space-y-2">
      {title && <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>}
      {catalogues.map((doc) => (
        <div key={doc.id} className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-semibold text-gray-700">{doc.title}</p>
            <p className="text-[11px] text-gray-400">
              {KIND_LABEL[doc.kind] || 'Document'}{doc.size ? ` · ${formatFileSize(doc.size)}` : ''}
            </p>
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-white">View</a>
            <a href={`${doc.url}${doc.url.includes('?') ? '&' : '?'}download=1`}
              className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-700">Download</a>
          </div>
        </div>
      ))}
    </div>
  )
}
