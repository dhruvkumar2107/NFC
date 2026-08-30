"use client"
import { useEffect, useState } from 'react'

export default function AdminCommissionPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ minCards: '', maxCards: '', commissionPerCard: '', pointsPerCard: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/commission-rules', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setRules(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/commission-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        minCards: parseInt(form.minCards),
        maxCards: form.maxCards ? parseInt(form.maxCards) : null,
        commissionPerCard: parseFloat(form.commissionPerCard),
        pointsPerCard: parseInt(form.pointsPerCard) || parseFloat(form.commissionPerCard),
      }),
    })
    const data = await res.json()
    if (data.success) {
      setForm({ minCards: '', maxCards: '', commissionPerCard: '', pointsPerCard: '' })
      const r2 = await fetch('/api/admin/commission-rules', { headers: { Authorization: `Bearer ${token}` } })
      const d2 = await r2.json()
      if (d2.success) setRules(d2.data)
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/commission-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    })
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !active } : r))
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this commission rule?')) return
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/commission-rules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setRules(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Commission & Points Rules</h1>
      <p className="text-gray-600 text-sm mb-6">
        Define how much commission (₹) and points employees earn per card sold at each sales tier.
        Points can be redeemed for cash (1 point = ₹1). Rules are off by default until activated.
      </p>

      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Add Commission Rule</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
          <div><label className="label">Min Cards</label><input type="number" className="input-field w-24" value={form.minCards} onChange={e => setForm(f => ({ ...f, minCards: e.target.value }))} required /></div>
          <div><label className="label">Max Cards (∞)</label><input type="number" className="input-field w-32" value={form.maxCards} onChange={e => setForm(f => ({ ...f, maxCards: e.target.value }))} placeholder="No limit" /></div>
          <div><label className="label">₹ / Card</label><input type="number" step="0.01" className="input-field w-28" value={form.commissionPerCard} onChange={e => setForm(f => ({ ...f, commissionPerCard: e.target.value }))} required /></div>
          <div><label className="label">Points / Card</label><input type="number" className="input-field w-28" value={form.pointsPerCard} onChange={e => setForm(f => ({ ...f, pointsPerCard: e.target.value }))} placeholder="Same as ₹" /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add Rule'}</button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Cards Range</th>
              <th className="text-left p-3 font-medium text-gray-600">₹ / Card</th>
              <th className="text-left p-3 font-medium text-gray-600">Points / Card</th>
              <th className="text-left p-3 font-medium text-gray-600">Active</th>
              <th className="text-left p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-3">{r.minCards} - {r.maxCards || '∞'}</td>
                <td className="p-3 font-bold">₹{r.commissionPerCard}</td>
                <td className="p-3 font-bold text-primary-600">{r.pointsPerCard || r.commissionPerCard} pts</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => toggleActive(r.id, r.active)} className="text-sm text-primary-600 hover:underline">
                    {r.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteRule(r.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
