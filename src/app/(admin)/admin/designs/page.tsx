"use client"
import { useEffect, useState } from 'react'

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', imageUrl: '' })
  const [saving, setSaving] = useState(false)

  const fetchDesigns = () => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/designs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setDesigns(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchDesigns() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: form.name, price: parseFloat(form.price), imageUrl: form.imageUrl || null }),
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ name: '', price: '', imageUrl: '' })
      fetchDesigns()
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/designs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    })
    setDesigns(prev => prev.map(d => d.id === id ? { ...d, active: !active } : d))
  }

  async function deleteDesign(id: string, name: string) {
    if (!confirm(`Delete design "${name}"?`)) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/designs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) setDesigns(prev => prev.filter(x => x.id !== id))
    else alert(d.error)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Card Designs ({designs.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? 'Cancel' : '+ Add Design'}</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">New Design</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Price (₹) *</label><input type="number" className="input-field" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></div>
            <div><label className="label">Image URL</label><input className="input-field" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
            <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button></div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {designs.map((d) => (
          <div key={d.id} className={`card ${!d.opacity ? '' : 'opacity-60'}`}>
            {d.imageUrl && (
              <div className="h-40 rounded-xl mb-4 overflow-hidden bg-gray-50">
                <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="font-semibold text-lg">{d.name}</h3>
            <div className="text-2xl font-bold text-primary-600 my-2">₹{d.price}</div>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {d.active ? 'Active' : 'Inactive'}
              </span>
              <div className="space-x-2">
                <button onClick={() => toggleActive(d.id, d.active)} className="text-sm text-primary-600 hover:underline">
                  {d.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => deleteDesign(d.id, d.name)} className="text-sm text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
