"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Admin form that creates a card (for a new or existing customer) and opens it in the builder. */
export default function CreateCardForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [customers, setCustomers] = useState<any[]>([])
  const [designs, setDesigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [form, setForm] = useState({ customerId: '', name: '', mobile: '', email: '', designation: '', company: '', designId: '', templateId: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const auth = { headers: { Authorization: `Bearer ${token}` } }
    fetch('/api/designs').then(r => r.json()).then(d => { if (d.success) setDesigns(d.data) }).catch(() => {})
    fetch('/api/admin/customers', auth).then(r => r.json()).then(d => { if (d.success) setCustomers(d.data) }).catch(() => {})
    fetch('/api/admin/templates?active=true', auth).then(r => r.json()).then(d => { if (d.success) setTemplates(d.data.templates || []) }).catch(() => {})
  }, [])

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function createCard(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'existing' && !form.customerId) { setError('Please select a customer.'); return }
    if (mode === 'new' && !form.name.trim()) { setError('Customer name is required.'); return }
    if (!form.designId) { setError('Please choose a card design.'); return }

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
          templateId: form.templateId || undefined,
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

  return (
    <form onSubmit={createCard} className="card mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-semibold">Create a new card</h2>
        <div className="flex rounded-lg border border-gray-200 p-0.5">
          <button type="button" onClick={() => setMode('new')}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === 'new' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}>New customer</button>
          <button type="button" onClick={() => setMode('existing')}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === 'existing' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}>Existing customer</button>
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
          {availableCustomers.length === 0 && <p className="mt-1 text-xs text-gray-400">Every customer already has a card. Open their card from the list instead.</p>}
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Card design *</label>
          <select className="input-field" value={form.designId} onChange={e => update('designId', e.target.value)}>
            <option value="">— Choose a design —</option>
            {designs.map(d => <option key={d.id} value={d.id}>{d.name} — ₹{d.price}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Start from</label>
          <select className="input-field" value={form.templateId} onChange={e => update('templateId', e.target.value)}>
            <option value="">Blank card (build from scratch)</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name} template</option>)}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-400">A card ID and NFC number are generated automatically. You’ll be taken straight to the builder to add the theme, sections, gallery, products, catalogues and EMI, then publish.</p>

      <button type="submit" disabled={creating} className="btn-primary">
        {creating ? 'Creating card...' : 'Create card & open builder'}
      </button>
    </form>
  )
}
