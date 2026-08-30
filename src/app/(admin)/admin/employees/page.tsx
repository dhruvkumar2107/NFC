"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', territory: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const fetchEmployees = (q?: string) => {
    const token = localStorage.getItem('token')
    const params = q ? `?search=${encodeURIComponent(q)}` : ''
    fetch(`/api/admin/employees${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setEmployees(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchEmployees() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(search), 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/employees', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) { setShowForm(false); setForm({ name: '', email: '', mobile: '', territory: '', password: '' }); fetchEmployees() }
    else alert(data.error)
    setSaving(false)
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this employee?')) return
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/employees/${id}/deactivate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    fetchEmployees(search)
  }

  async function activate(id: string) {
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/employees/${id}/activate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    fetchEmployees(search)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Employees ({employees.length})</h1>
        <div className="flex gap-3">
          <input className="input-field w-64" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary whitespace-nowrap">{showForm ? 'Cancel' : '+ Add'}</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">New Employee</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Email *</label><input className="input-field" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><label className="label">Password *</label><input className="input-field" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></div>
            <div><label className="label">Mobile</label><input className="input-field" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></div>
            <div><label className="label">Territory</label><input className="input-field" value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} /></div>
            <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button></div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">ID</th>
              <th className="text-left p-3 font-medium text-gray-600">Name</th>
              <th className="text-left p-3 font-medium text-gray-600">Email</th>
              <th className="text-left p-3 font-medium text-gray-600">Customers</th>
              <th className="text-left p-3 font-medium text-gray-600">Orders</th>
              <th className="text-left p-3 font-medium text-gray-600">Points</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{e.employeeId}</td>
                <td className="p-3"><Link href={`/admin/employees/${e.id}`} className="font-medium text-primary-600 hover:underline">{e.name}</Link></td>
                <td className="p-3 text-gray-600">{e.email}</td>
                <td className="p-3">{e.customers?.length || 0}</td>
                <td className="p-3">{e.orders?.length || 0}</td>
                <td className="p-3 text-primary-600 font-bold">{e.totalPoints || 0} <span className="text-xs text-gray-400">/ {e.availablePoints || 0} avail</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.status}</span></td>
                <td className="p-3 space-x-2">
                  <Link href={`/admin/employees/${e.id}`} className="text-sm text-primary-600 hover:underline">View</Link>
                  {e.status === 'active' ? (
                    <button onClick={() => deactivate(e.id)} className="text-sm text-red-600 hover:underline">Deactivate</button>
                  ) : (
                    <button onClick={() => activate(e.id)} className="text-sm text-green-600 hover:underline">Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
