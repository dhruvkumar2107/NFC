"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminCardsPage() {
  const router = useRouter()
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showMaker, setShowMaker] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [customers, setCustomers] = useState<any[]>([])
  const [designs, setDesigns] = useState<any[]>([])
  const [form, setForm] = useState({ customerId: '', name: '', mobile: '', email: '', designation: '', company: '', designId: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function loadCards() {
    const token = localStorage.getItem('token')
    const r = await fetch('/api/admin/cards', { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    if (d.success) setCards(d.data)
    setLoading(false)
  }

  useEffect(() => {
    loadCards()
    const token = localStorage.getItem('token')
    fetch('/api/designs').then(r => r.json()).then(d => { if (d.success) setDesigns(d.data) }).catch(() => {})
    fetch('/api/admin/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setCustomers(d.data) }).catch(() => {})
  }, [])

  async function updateStatus(cardId: string, status: string) {
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/cards/${cardId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status } : c))
  }

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function createCard(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.designId) { setError('Please choose a card design.'); return }
    if (mode === 'existing' && !form.customerId) { setError('Please select a customer.'); return }
    if (mode === 'new' && !form.name.trim()) { setError('Customer name is required.'); return }

    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/cards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId: mode === 'existing' ? form.customerId : undefined,
          name: mode === 'new' ? form.name : undefined,
          mobile: mode === 'new' ? form.mobile : undefined,
          email: mode === 'new' ? form.email : undefined,
          designation: mode === 'new' ? form.designation : undefined,
          company: mode === 'new' ? form.company : undefined,
          designId: form.designId,
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      router.push(`/admin/builder/${d.data.id}`)
    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  const availableCustomers = customers.filter(c => !c.card)

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Cards ({cards.length})</h1>
          <p className="text-sm text-gray-500">Make a card for a customer, then customize its theme, sections, products, gallery and EMI calculator in the builder.</p>
        </div>
        <button onClick={() => { setShowMaker(s => !s); setError('') }}
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          {showMaker ? 'Cancel' : '+ Make Customer Card'}
        </button>
      </div>

      {showMaker && (
        <form onSubmit={createCard} className="card mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 font-semibold">Make a card</h2>
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              <button type="button" onClick={() => setMode('existing')}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === 'existing' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}>Existing customer</button>
              <button type="button" onClick={() => setMode('new')}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === 'new' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}>New customer</button>
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {mode === 'existing' ? (
            <div>
              <label className="label">Select customer</label>
              <select className="input-field" value={form.customerId} onChange={e => update('customerId', e.target.value)}>
                <option value="">— Choose a customer without a card —</option>
                {availableCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.mobile ? ` — ${c.mobile}` : ''}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
              {availableCustomers.length === 0 && <p className="mt-1 text-xs text-gray-400">Every customer already has a card. Use “Customize” in the list below instead.</p>}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">Full Name *</label><input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} /></div>
              <div><label className="label">Mobile</label><input className="input-field" value={form.mobile} onChange={e => update('mobile', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
              <div><label className="label">Company</label><input className="input-field" value={form.company} onChange={e => update('company', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="label">Designation</label><input className="input-field" value={form.designation} onChange={e => update('designation', e.target.value)} /></div>
            </div>
          )}

          <div>
            <label className="label">Card design *</label>
            <select className="input-field" value={form.designId} onChange={e => update('designId', e.target.value)}>
              <option value="">— Choose a design —</option>
              {designs.map(d => <option key={d.id} value={d.id}>{d.name} — ₹{d.price}</option>)}
            </select>
          </div>

          <p className="text-xs text-gray-400">A card ID and NFC number are generated automatically. You’ll be taken to the builder to customize the card (including the EMI calculator) and publish it.</p>

          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating card...' : 'Create card & open builder'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Card ID</th>
              <th className="text-left p-3 font-medium text-gray-600">NFC Card No.</th>
              <th className="text-left p-3 font-medium text-gray-600">Customer</th>
              <th className="text-left p-3 font-medium text-gray-600">Design</th>
              <th className="text-left p-3 font-medium text-gray-600">Employee</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Created</th>
              <th className="text-left p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono font-bold"><Link href={`/admin/cards/${c.id}`} className="text-primary-600 hover:underline">{c.cardId}</Link></td>
                <td className="p-3 font-mono text-primary-600 font-bold">{c.nfcCardNumber || '-'}</td>
                <td className="p-3">{c.customer ? <Link href={`/admin/customers/${c.customer.id}`} className="text-primary-600 hover:underline">{c.customer.name}</Link> : <span className="text-gray-400">-</span>}</td>
                <td className="p-3">{c.design?.name || '-'}</td>
                <td className="p-3 text-gray-600 text-xs">{c.employee?.employeeId || '-'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-green-100 text-green-700' : c.status === 'Delivered' ? 'bg-blue-100 text-blue-700' : c.status === 'Deactivated' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                <td className="p-3 text-gray-600 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <Link href={`/admin/builder/${c.id}`} className="text-sm font-semibold text-primary-600 hover:underline">Customize</Link>
                  <Link href={`/admin/cards/${c.id}`} className="text-sm text-primary-600 hover:underline">View</Link>
                  {c.status !== 'Active' && <button onClick={() => updateStatus(c.id, 'Active')} className="text-sm text-green-600 hover:underline">Activate</button>}
                  {c.status !== 'Deactivated' && <button onClick={() => updateStatus(c.id, 'Deactivated')} className="text-sm text-red-600 hover:underline">Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
