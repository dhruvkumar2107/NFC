"use client"

import { useMemo, useState } from 'react'
import { formatInr } from '@/lib/emi'
import type { PublicProduct } from '@/lib/card-data'

interface Props {
  products: PublicProduct[]
  categories: { id: string; name: string }[]
  mode: 'products' | 'priceList'
  whatsapp?: string | null
  onEnquire?: (product: PublicProduct) => void
}

function stockLabel(status: string): { text: string; cls: string } {
  if (status === 'out_of_stock') return { text: 'Out of stock', cls: 'bg-red-100 text-red-600' }
  if (status === 'pre_order') return { text: 'Pre-order', cls: 'bg-amber-100 text-amber-700' }
  return { text: 'In stock', cls: 'bg-green-100 text-green-700' }
}

export default function ProductCatalog({ products, categories, mode, whatsapp, onEnquire }: Props) {
  const [cat, setCat] = useState<string>('all')
  const [selected, setSelected] = useState<PublicProduct | null>(null)

  const filtered = useMemo(
    () => (cat === 'all' ? products : products.filter((p) => p.categoryId === cat)),
    [products, cat]
  )

  if (products.length === 0) return null

  if (mode === 'priceList') {
    return (
      <div className="glass-subtle overflow-hidden rounded-2xl">
        {filtered.map((p, i) => (
          <div key={p.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{p.name}</p>
              {p.description && <p className="truncate text-xs text-gray-400">{p.description}</p>}
            </div>
            <div className="flex-shrink-0 text-right">
              {p.price != null && <p className="text-sm font-bold text-gray-800">{formatInr(p.price)}</p>}
              {p.mrp != null && p.price != null && p.mrp > p.price && (
                <p className="text-[11px] text-gray-400 line-through">{formatInr(p.mrp)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCat('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${cat === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${cat === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => {
          const stock = stockLabel(p.stockStatus)
          const attrs = Object.entries(p.attributes).slice(0, 3)
          return (
            <div key={p.id} className="glass-subtle overflow-hidden rounded-2xl">
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-28 w-full object-cover" />}
              <div className="space-y-1.5 p-3">
                <p className="line-clamp-2 text-sm font-semibold text-gray-800">{p.name}</p>
                <div className="flex items-baseline gap-1.5">
                  {p.price != null && <span className="text-sm font-bold text-gray-900">{formatInr(p.price)}</span>}
                  {p.mrp != null && p.price != null && p.mrp > p.price && (
                    <span className="text-[11px] text-gray-400 line-through">{formatInr(p.mrp)}</span>
                  )}
                  {p.discountPct ? <span className="text-[11px] font-semibold text-green-600">{Math.round(p.discountPct)}% off</span> : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stock.cls}`}>{stock.text}</span>
                </div>
                {attrs.length > 0 && (
                  <p className="text-[11px] text-gray-400">{attrs.map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                )}
                <div className="flex gap-1.5 pt-1">
                  <button type="button" onClick={() => setSelected(p)} className="flex-1 rounded-lg bg-primary-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-700">View</button>
                  {onEnquire && (
                    <button type="button" onClick={() => onEnquire(p)} className="flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-200">Enquire</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setSelected(null)} role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            {selected.imageUrl && <img src={selected.imageUrl} alt={selected.name} className="mb-3 h-48 w-full rounded-2xl object-cover" />}
            <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              {selected.price != null && <span className="text-xl font-bold text-gray-900">{formatInr(selected.price)}</span>}
              {selected.mrp != null && selected.price != null && selected.mrp > selected.price && (
                <span className="text-sm text-gray-400 line-through">{formatInr(selected.mrp)}</span>
              )}
            </div>
            {selected.description && <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{selected.description}</p>}
            {Object.keys(selected.attributes).length > 0 && (
              <dl className="mt-3 divide-y divide-gray-100 rounded-xl bg-gray-50 px-3">
                {Object.entries(selected.attributes).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2 text-sm">
                    <dt className="capitalize text-gray-500">{k}</dt>
                    <dd className="text-right font-medium text-gray-800">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-4 flex gap-2">
              {onEnquire && (
                <button type="button" onClick={() => { onEnquire(selected); setSelected(null) }}
                  className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">Enquire</button>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I am interested in "${selected.name}".`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700">WhatsApp</a>
              )}
            </div>
            <button type="button" onClick={() => setSelected(null)} className="mt-2 w-full rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
