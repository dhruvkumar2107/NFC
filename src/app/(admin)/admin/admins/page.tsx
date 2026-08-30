"use client"
import { useEffect, useState } from 'react'

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  const fetchAdmins = () => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setAdmins(d.data); setLoading(false) })
  }
  useEffect(() => { fetchAdmins() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/admins', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.success) { setShowForm(false); setForm({ name: '', email: '', password: '' }); fetchAdmins() }
    else alert(d.error)
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete admin "${name}"?`)) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) fetchAdmins()
    else alert(d.error)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Accounts ({admins.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? 'Cancel' : '+ Add Admin'}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">New Admin</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-4">
            <div><label className="label">Name</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><label className="label">Password</label><input className="input-field" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></div>
            <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button></div>
          </form>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left p-3 font-medium text-gray-600">Name</th>
            <th className="text-left p-3 font-medium text-gray-600">Email</th>
            <th className="text-left p-3 font-medium text-gray-600">Created</th>
            <th className="text-left p-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3 text-gray-600">{a.email}</td>
                <td className="p-3 text-gray-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="p-3"><button onClick={() => handleDelete(a.id, a.name)} className="text-sm text-red-600 hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}