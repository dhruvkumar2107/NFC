"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import CreateCardForm from '@/components/builder/CreateCardForm'

export default function AdminBuilderPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/cards', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCards(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = cards.filter((c) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      c.cardId?.toLowerCase().includes(q) ||
      c.customer?.name?.toLowerCase().includes(q) ||
      c.customer?.company?.toLowerCase().includes(q)
    )
  })

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-gray-200" />{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100" />)}</div>

  const statusStyle: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    unpublished: 'bg-amber-100 text-amber-700',
    draft: 'bg-gray-100 text-gray-600',
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Custom Card Builder</h1>
          <p className="text-sm text-gray-500">Configure industry templates, sections, media, products and catalogues for each card.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <input className="input-field w-full md:w-72" placeholder="Search by card ID, name or company..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setShowCreate((s) => !s)}
            className="whitespace-nowrap rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            {showCreate ? 'Cancel' : '+ Create New Card'}
          </button>
        </div>
      </div>

      {showCreate && <CreateCardForm />}

      <div className="space-y-2">
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">No cards found.</div>}
        {filtered.map((c) => {
          const bc = c.builderConfig
          const status = bc?.status || 'draft'
          return (
            <Link key={c.id} href={`/admin/builder/${c.id}`} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-primary-200 hover:shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-primary-600">{c.cardId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle[status] || statusStyle.draft}`}>{status}</span>
                </div>
                <p className="truncate text-sm text-gray-700">{c.customer?.name || 'Unassigned'}{c.customer?.company ? ` · ${c.customer.company}` : ''}</p>
              </div>
              <div className="hidden text-right text-xs text-gray-400 sm:block">
                <p>{bc?.template?.name || bc?.industry || 'General'}</p>
                <p>{bc?._count ? `${bc._count.albums} albums · ${bc._count.products} products · ${bc._count.catalogues} docs` : 'Not configured'}</p>
              </div>
              <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">Open builder</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
