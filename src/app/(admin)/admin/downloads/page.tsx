"use client"

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api-client'

interface CardOption {
  id: string
  cardId: string
  nfcCardNumber: string | null
  status: string
  customer: { name: string } | null
}

interface Inventory {
  card: { id: string; cardId: string; nfcCardNumber: string | null; status: string }
  customerName: string
  manifest: {
    counts: Record<string, number>
    available: Record<string, boolean>
    albums: { id: string; name: string; count: number }[]
  }
  folders: { folder: string; label: string; count: number; size: number }[]
  totalSize: number
  totalSizeLabel: string
  base: string
  profileUrl: string
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminDownloadsPage() {
  const [cards, setCards] = useState<any[]>([])
  const [cardId, setCardId] = useState('')
  const [inventory, setInventory] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiFetch('/api/admin/cards')
      .then((res) => setCards(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load cards'))
  }, [])

  useEffect(() => {
    if (!cardId) { setInventory(null); return }
    setLoading(true)
    setError(null)
    apiFetch(`/api/admin/cards/${cardId}/downloads`)
      .then((res) => setInventory(res.data))
      .catch((err) => setError(err.message || 'Failed to load inventory'))
      .finally(() => setLoading(false))
  }, [cardId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cards.slice(0, 50)
    return cards
      .filter((c: any) =>
        [c.cardId, c.nfcCardNumber, c.customer?.name].filter(Boolean).join(' ').toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [cards, query])

  const selected = cards.find((c: any) => c.id === cardId)
  const base = inventory?.base as string | undefined

  function open(url: string) {
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Downloads &amp; Media</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit and preview the download centre generated for any customer card, and verify every file that will be bundled.
        </p>
      </div>

      <div className="glass-subtle rounded-2xl p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Search cards</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Card ID, NFC number or customer name"
          className="mb-3 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-primary-400"
        />
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-primary-400"
        >
          <option value="">Select a card…</option>
          {filtered.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.cardId} · {c.customer?.name || 'No customer'} {c.nfcCardNumber ? `· ${c.nfcCardNumber}` : ''}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="h-24 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      )}

      {inventory && !loading && (
        <>
          <div className="glass-subtle rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-gray-800">{inventory.customerName}</p>
                <p className="mt-0.5 font-mono text-xs text-gray-500">
                  {inventory.card.cardId}
                  {inventory.card.nfcCardNumber ? ` · ${inventory.card.nfcCardNumber}` : ''} · {inventory.card.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-400">Estimated bundle size</p>
                <p className="text-lg font-bold text-gray-800">{inventory.totalSizeLabel}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => open(`${base}/download?type=everything`)} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                Download Everything
              </button>
              <button type="button" onClick={() => open(`${base}/profile-pdf`)} className="rounded-xl border border-gray-200 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary-300">
                Preview PDF
              </button>
              <button type="button" onClick={() => open(`${base}/vcard?download=1`)} className="rounded-xl border border-gray-200 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary-300">
                Contact File
              </button>
              {inventory.profileUrl && (
                <button type="button" onClick={() => open(inventory.profileUrl)} className="rounded-xl border border-gray-200 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary-300">
                  Open Public Card
                </button>
              )}
            </div>
          </div>

          <div className="glass-subtle overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Bundle folder</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Contents</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Files</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.folders.map((folder: any) => (
                  <tr key={folder.folder} className="hover:bg-white/60">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{folder.folder}/</td>
                    <td className="px-4 py-3 text-gray-600">{folder.label}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{folder.count}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{folder.size ? formatSize(folder.size) : '—'}</td>
                  </tr>
                ))}
                {inventory.folders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      No downloadable files published for this card yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Photos', value: inventory.manifest?.counts?.photos ?? 0 },
              { label: 'Documents', value: inventory.manifest?.counts?.documents ?? 0 },
              { label: 'Catalogues', value: (inventory.manifest?.counts?.catalogues ?? 0) + (inventory.manifest?.counts?.priceLists ?? 0) + (inventory.manifest?.counts?.brochures ?? 0) },
              { label: 'Products', value: inventory.manifest?.counts?.products ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="glass-subtle rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!cardId && !loading && (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
          Select a card to inspect its download bundle.
        </div>
      )}
    </div>
  )
}
