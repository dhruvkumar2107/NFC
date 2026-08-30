"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`/api/admin/employees/${params.id}`, { headers }).then(r => r.json()),
      fetch(`/api/admin/employees/${params.id}/wallet`, { headers }).then(r => r.json()),
    ]).then(([emp, w]) => {
      if (emp.success) setEmployee(emp.data)
      if (w.success) setWallet(w.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [params.id])

  async function resetPassword() {
    if (!pw) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/employees/${params.id}/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: pw }),
    })
    const d = await res.json()
    setMsg(d.success ? 'Password reset!' : d.error)
    setPw('')
  }

  async function toggleStatus() {
    const token = localStorage.getItem('token')
    const endpoint = employee.status === 'active' ? 'deactivate' : 'activate'
    await fetch(`/api/admin/employees/${params.id}/${endpoint}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    setEmployee((e: any) => ({ ...e, status: e.status === 'active' ? 'inactive' : 'active' }))
  }

  async function deleteEmployee() {
    if (!confirm('DELETE this employee? This cannot be undone.')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/employees/${params.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) router.push('/admin/employees')
    else alert(d.error)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!employee) return <div className="text-center py-12 text-gray-500">Employee not found.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/employees" className="text-sm text-primary-600 hover:underline">← Back to Employees</Link>
          <h1 className="text-2xl font-bold mt-1">{employee.name}</h1>
          <p className="text-gray-500 text-sm">{employee.employeeId} • {employee.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleStatus} className={`px-4 py-2 rounded-lg text-sm font-medium ${employee.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            {employee.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={deleteEmployee} className="btn-danger text-sm">Delete</button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500">Total Sales</div><div className="text-2xl font-bold">{employee.orders?.length || 0}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Customers</div><div className="text-2xl font-bold">{employee.customers?.length || 0}</div></div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white"><div className="text-sm opacity-80">Available Points</div><div className="text-2xl font-bold">{wallet?.wallet?.availablePoints || 0}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Total Earned</div><div className="text-2xl font-bold">{wallet?.wallet?.totalPoints || 0} pts</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Profile</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Mobile:</span> {employee.mobile || '-'}</div>
            <div><span className="text-gray-500">Territory:</span> {employee.territory || '-'}</div>
            <div><span className="text-gray-500">Referral Code:</span> <span className="font-mono font-bold">{employee.referralLinkCode}</span></div>
            <div><span className="text-gray-500">Joined:</span> {new Date(employee.joiningDate).toLocaleDateString()}</div>
            <div><span className="text-gray-500">Status:</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{employee.status}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Reset Password</h2>
          {msg && <div className={`p-2 rounded text-sm mb-3 ${msg.includes('success') || msg.includes('reset') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
          <div className="flex gap-2">
            <input type="password" className="input-field flex-1" placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} />
            <button onClick={resetPassword} className="btn-primary text-sm whitespace-nowrap">Reset</button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {wallet?.transactions?.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Wallet Transactions</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50"><tr>
                <th className="text-left p-2 font-medium text-gray-600">Date</th>
                <th className="text-left p-2 font-medium text-gray-600">Type</th>
                <th className="text-left p-2 font-medium text-gray-600">Points</th>
                <th className="text-left p-2 font-medium text-gray-600">Description</th>
              </tr></thead>
              <tbody className="divide-y">
                {wallet.transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-2 text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-2"><span className="px-2 py-0.5 rounded text-xs bg-gray-100">{t.type.replace(/_/g, ' ')}</span></td>
                    <td className={`p-2 font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.points > 0 ? '+' : ''}{t.points}</td>
                    <td className="p-2 text-gray-600 text-xs">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders */}
      {employee.orders?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Orders ({employee.orders.length})</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50"><tr>
                <th className="text-left p-2 font-medium text-gray-600">Order</th>
                <th className="text-left p-2 font-medium text-gray-600">Customer</th>
                <th className="text-left p-2 font-medium text-gray-600">Amount</th>
                <th className="text-left p-2 font-medium text-gray-600">Points</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {employee.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-2 font-mono"><Link href={`/admin/orders/${o.id}`} className="text-primary-600 hover:underline">{o.orderId}</Link></td>
                    <td className="p-2">{o.customer?.name || '-'}</td>
                    <td className="p-2">₹{o.amount}</td>
                    <td className="p-2 text-primary-600 font-bold">+{o.commissionPoints || 0}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}