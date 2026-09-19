"use client"
import { useEffect, useState } from 'react'

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error('Upload failed') }
  if (!data.success) throw new Error(data.error || 'Upload failed')
  return data.url
}

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', price: '', imageUrl: '', backImage: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchDesigns = () => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/designs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setDesigns(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchDesigns() }, [])

  const filteredDesigns = showInactive ? designs : designs.filter(d => d.active)

  function resetForm() {
    setForm({ name: '', price: '', imageUrl: '', backImage: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(d: any) {
    setForm({ name: d.name, price: String(d.price), imageUrl: d.imageUrl || '', backImage: d.backImage || '' })
    setEditingId(d.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const token = localStorage.getItem('token')
    const body = {
      name: form.name,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl || null,
      backImage: form.backImage || null,
    }

    if (editingId) {
      const res = await fetch(`/api/admin/designs/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setMsg('Design updated!')
        resetForm()
        fetchDesigns()
      } else {
        setMsg(data.error || 'Failed to update')
      }
    } else {
      const res = await fetch('/api/admin/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...body, active: true }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg('Design created!')
        resetForm()
        fetchDesigns()
      } else {
        setMsg(data.error || 'Failed to create')
      }
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
    if (!confirm(`Delete design "${name}"? This cannot be undone.`)) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/designs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) {
      setDesigns(prev => prev.filter(x => x.id !== id))
      setMsg('Design deleted!')
    } else {
      alert(d.error || 'Cannot delete - design has existing orders/cards')
    }
  }

  async function handleImageUpload(file: File, field: 'imageUrl' | 'backImage') {
    setUploading(field)
    try {
      const url = await uploadFile(file)
      setForm(f => ({ ...f, [field]: url }))
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Try again'))
    }
    setUploading(null)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Card Designs</h1>
          <p className="text-sm text-gray-500">{designs.length} total ({designs.filter(d => d.active).length} active)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInactive(!showInactive)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">+ Add Design</button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('fail') || msg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">{editingId ? 'Edit Design' : 'New Design'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Design Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Velvet Premium Card" />
              </div>
              <div>
                <label className="label">Price (₹) *</label>
                <input type="number" min="1" className="input-field" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="699" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Front Image</label>
                {form.imageUrl && <img src={form.imageUrl} alt="Front" className="w-full h-32 object-cover rounded-lg mb-2 border" />}
                <label className="flex items-center gap-2 p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary-400">
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'imageUrl') }} />
                  {uploading === 'imageUrl' ? (
                    <span className="text-xs text-primary-600">Uploading...</span>
                  ) : (
                    <span className="text-xs text-gray-500">{form.imageUrl ? 'Change front image' : 'Upload front image'}</span>
                  )}
                </label>
              </div>
              <div>
                <label className="label">Back Image</label>
                {form.backImage && <img src={form.backImage} alt="Back" className="w-full h-32 object-cover rounded-lg mb-2 border" />}
                <label className="flex items-center gap-2 p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary-400">
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'backImage') }} />
                  {uploading === 'backImage' ? (
                    <span className="text-xs text-primary-600">Uploading...</span>
                  ) : (
                    <span className="text-xs text-gray-500">{form.backImage ? 'Change back image' : 'Upload back image'}</span>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update Design' : 'Create Design'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {filteredDesigns.map((d) => (
          <div key={d.id} className={`card ${!d.active ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-2 gap-2 h-40 rounded-xl mb-4 overflow-hidden bg-gray-50">
              {d.imageUrl && (
                <div className="relative">
                  <img src={d.imageUrl} alt={`${d.name} - Front`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-[8px] bg-black/50 text-white px-1 rounded">Front</span>
                </div>
              )}
              {d.backImage ? (
                <div className="relative">
                  <img src={d.backImage} alt={`${d.name} - Back`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-[8px] bg-black/50 text-white px-1 rounded">Back</span>
                </div>
              ) : d.imageUrl ? (
                <div className="relative">
                  <img src={d.imageUrl} alt={`${d.name} - Back`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-[8px] bg-black/50 text-white px-1 rounded">Back</span>
                </div>
              ) : null}
            </div>
            <h3 className="font-semibold text-lg">{d.name}</h3>
            <div className="text-2xl font-bold text-primary-600 my-2">₹{d.price}</div>
            <div className="flex items-center justify-between mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {d.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => startEdit(d)} className="flex-1 text-center text-sm py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium">Edit</button>
              <button onClick={() => toggleActive(d.id, d.active)} className={`flex-1 text-center text-sm py-1.5 rounded-lg font-medium ${d.active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {d.active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => deleteDesign(d.id, d.name)} className="text-sm py-1.5 px-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium">Delete</button>
            </div>
          </div>
        ))}
        {filteredDesigns.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            {showInactive ? 'No designs found' : 'No active designs. Click "Show Inactive" or add a new design.'}
          </div>
        )}
      </div>
    </div>
  )
}
