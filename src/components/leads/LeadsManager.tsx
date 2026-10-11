"use client"
import { useCallback, useEffect, useState } from 'react'

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']
const SOURCES = ['card_form', 'card', 'call', 'whatsapp', 'email', 'walk_in', 'other']

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-gray-200 text-gray-600',
}

async function jfetch(url: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(url, { ...init, headers: { ...(init?.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`)
  return data.data
}

export interface LeadsManagerProps {
  /** e.g. '/api/admin/leads' or '/api/customer/leads' */
  base: string
  heading?: string
  subtitle?: string
  /** Show the "business/card" context column (admin only). */
  showCard?: boolean
}

export default function LeadsManager({ base, heading = 'Leads & Enquiries', subtitle, showCard = false }: LeadsManagerProps) {
  const [leads, setLeads] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState<any>(null)
  const [note, setNote] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (status) params.set('status', status)
      if (source) params.set('source', source)
      if (search) params.set('q', search)
      const data = await jfetch(`${base}?${params}`)
      setLeads(data.leads)
      setTotal(data.total)
      setCounts(data.counts || {})
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [base, page, pageSize, status, source, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openLead(id: string) {
    setDetailLoading(true)
    setSelected({ id })
    try { setSelected(await jfetch(`${base}/${id}`)) } catch { setSelected(null) } finally { setDetailLoading(false) }
  }

  async function updateStatus(id: string, newStatus: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)))
    setCounts((c) => ({ ...c, [newStatus]: (c[newStatus] || 0) + 1 }))
    try {
      await jfetch(`${base}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: newStatus }))
    } catch { load() }
  }

  async function addNote() {
    if (!note.trim() || !selected?.id) return
    try {
      await jfetch(`${base}/${selected.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) })
      setNote('')
      setSelected(await jfetch(`${base}/${selected.id}`))
    } catch (e: any) { alert(e.message) }
  }

  async function exportCsv() {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (source) params.set('source', source)
    if (search) params.set('q', search)
    const res = await fetch(`${base}/export?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <button onClick={exportCsv} className="btn btn-secondary w-full md:w-auto">Export CSV</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => { setStatus(''); setPage(1) }} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${!status ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({total})</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${status === s ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s} ({counts[s] || 0})</button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="input-field flex-1" placeholder="Search name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} className="input-field sm:w-48">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="animate-pulse space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100" />)}</div> : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/80">
              <tr>
                <th className="p-3 text-left font-medium text-gray-600">Name</th>
                <th className="p-3 text-left font-medium text-gray-600">Contact</th>
                <th className="p-3 text-left font-medium text-gray-600">Subject</th>
                <th className="p-3 text-left font-medium text-gray-600">Source</th>
                {showCard && <th className="p-3 text-left font-medium text-gray-600">Card</th>}
                <th className="p-3 text-left font-medium text-gray-600">Status</th>
                <th className="p-3 text-left font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.length === 0 && <tr><td colSpan={showCard ? 7 : 6} className="p-10 text-center text-gray-400">No leads found.</td></tr>}
              {leads.map((l) => (
                <tr key={l.id} className="cursor-pointer transition hover:bg-gray-50" onClick={() => openLead(l.id)}>
                  <td className="p-3 font-medium">{l.name}</td>
                  <td className="p-3 text-gray-600"><div>{l.phone || '-'}</div><div className="text-xs text-gray-400">{l.email || ''}</div></td>
                  <td className="max-w-[220px] truncate p-3 text-gray-600">{l.subject || l.message || '-'}</td>
                  <td className="p-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{l.source}</span></td>
                  {showCard && <td className="p-3 font-mono text-xs text-primary-600">{l.card?.cardId || '-'}</td>}
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className={`cursor-pointer rounded-full px-2 py-1 text-xs font-semibold capitalize outline-none ${STATUS_STYLE[l.status]}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1 text-sm transition disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1 text-sm transition disabled:opacity-40">Next</button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl animate-slide-in-right">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">{selected.name || 'Lead'}</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">✕</button>
            </div>
            {detailLoading ? <div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded bg-gray-100" />)}</div> : (
              <div className="space-y-4">
                <div className="space-y-1.5 text-sm text-gray-600">
                  {selected.phone && <p className="flex items-center gap-2"><span className="text-gray-400">📞</span>{selected.phone}</p>}
                  {selected.email && <p className="flex items-center gap-2"><span className="text-gray-400">✉️</span>{selected.email}</p>}
                  {selected.subject && <p className="font-medium text-gray-800">{selected.subject}</p>}
                  {selected.message && <p className="rounded-lg bg-gray-50 p-3 whitespace-pre-line">{selected.message}</p>}
                  <p className="text-xs text-gray-400">Source: {selected.source} · Consent: {selected.consent ? 'yes' : 'no'}</p>
                  {showCard && selected.card && <p className="text-xs text-gray-400">Card {selected.card.cardId}{selected.card.customer?.name ? ` · ${selected.card.customer.name}` : ''}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">Status</label>
                  <select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)} className="input-field mt-1">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">Add follow-up note</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input-field mt-1" placeholder="Called customer, will follow up on..." />
                  <button onClick={addNote} className="btn btn-primary mt-2 w-full">Add note</button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
                  <div className="space-y-2">
                    {(selected.notes || []).length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
                    {(selected.notes || []).map((n: any) => (
                      <div key={n.id} className="rounded-lg border border-gray-100 p-2 text-sm">
                        <p className="text-gray-700 whitespace-pre-line">{n.note}</p>
                        <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}{n.followUpAt ? ` · follow-up ${new Date(n.followUpAt).toLocaleDateString()}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
