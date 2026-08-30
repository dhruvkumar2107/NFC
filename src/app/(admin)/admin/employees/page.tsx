"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CreatedEmployee {
  employeeId: string
  name: string
  email: string
  plainPassword: string
  referralLinkCode: string
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', territory: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [createdEmployee, setCreatedEmployee] = useState<CreatedEmployee | null>(null)
  const [copied, setCopied] = useState(false)

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
    if (data.success) {
      setCreatedEmployee({
        employeeId: data.data.employeeId,
        name: data.data.name,
        email: data.data.email,
        plainPassword: data.data.plainPassword,
        referralLinkCode: data.data.referralLinkCode,
      })
      setShowForm(false)
      setForm({ name: '', email: '', mobile: '', territory: '' })
      fetchEmployees()
    } else {
      alert(data.error)
    }
    setSaving(false)
  }

  function copyCredentials() {
    if (!createdEmployee) return
    const text = `MySmartCard Employee Login\n\nEmployee ID: ${createdEmployee.employeeId}\nEmail: ${createdEmployee.email}\nPassword: ${createdEmployee.plainPassword}\n\nLogin at: /employee/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <button onClick={() => setShowForm(!showForm)} className="btn-primary whitespace-nowrap">{showForm ? 'Cancel' : '+ Add Employee'}</button>
        </div>
      </div>

      {createdEmployee && (
        <div className="card mb-6 border-2 border-green-200 bg-green-50/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <div>
                <h2 className="font-semibold text-green-800">Employee Created Successfully</h2>
                <p className="text-sm text-green-600">Share these login credentials with {createdEmployee.name}</p>
              </div>
            </div>
            <button onClick={() => setCreatedEmployee(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-green-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Employee ID</span>
              <span className="font-mono font-bold text-gray-900">{createdEmployee.employeeId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{createdEmployee.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Password</span>
              <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{createdEmployee.plainPassword}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Referral Link Code</span>
              <span className="font-mono text-sm text-primary-600">{createdEmployee.referralLinkCode}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={copyCredentials} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button onClick={() => setCreatedEmployee(null)} className="btn-secondary">Dismiss</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">New Employee</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-4">
            <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Email *</label><input className="input-field" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><label className="label">Mobile</label><input className="input-field" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></div>
            <div><label className="label">Territory</label><input className="input-field" value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} /></div>
            <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Employee'}</button></div>
          </form>
          <p className="text-xs text-gray-400 mt-3">A secure password will be auto-generated and shown after creation.</p>
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
