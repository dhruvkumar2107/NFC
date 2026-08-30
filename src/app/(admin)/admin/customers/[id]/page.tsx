"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/admin/customers/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setCustomer(d.data); setForm(d.data) } setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  async function saveEdit() {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/customers/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.success) { setCustomer(d.data); setEditing(false); setMsg('Saved!') }
    else setMsg(d.error)
  }

  async function deleteCustomer() {
    if (!confirm('DELETE this customer? This cannot be undone.')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/customers/${params.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) router.push('/admin/customers')
    else alert(d.error)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found.</div>

  const socialLinks = JSON.parse(customer.socialLinks || '{}')
  let photos: string[] = []
  try { photos = JSON.parse(customer.photos || '[]') } catch { photos = [] }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/customers" className="text-sm text-primary-600 hover:underline">← Back to Customers</Link>
          <h1 className="text-2xl font-bold mt-1">{customer.name}</h1>
          <p className="text-gray-500 text-sm">{customer.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">{editing ? 'Cancel' : 'Edit'}</button>
          <button onClick={deleteCustomer} className="btn-danger text-sm">Delete</button>
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Profile</h2>
          {editing ? (
            <div className="space-y-3">
              <div><label className="label">Name</label><input className="input-field" value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Email</label><input className="input-field" value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="label">Mobile</label><input className="input-field" value={form.mobile || ''} onChange={e => setForm((f: any) => ({ ...f, mobile: e.target.value }))} /></div>
              <div><label className="label">WhatsApp</label><input className="input-field" value={form.whatsapp || ''} onChange={e => setForm((f: any) => ({ ...f, whatsapp: e.target.value }))} /></div>
              <div><label className="label">Designation</label><input className="input-field" value={form.designation || ''} onChange={e => setForm((f: any) => ({ ...f, designation: e.target.value }))} /></div>
              <div><label className="label">Company</label><input className="input-field" value={form.company || ''} onChange={e => setForm((f: any) => ({ ...f, company: e.target.value }))} /></div>
              <div><label className="label">Website</label><input className="input-field" value={form.website || ''} onChange={e => setForm((f: any) => ({ ...f, website: e.target.value }))} /></div>
              <div><label className="label">Address</label><input className="input-field" value={form.address || ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} placeholder="Flat/House No., Building, Street" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">City</label><input className="input-field" value={form.city || ''} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
                <div><label className="label">State</label><input className="input-field" value={form.state || ''} onChange={e => setForm((f: any) => ({ ...f, state: e.target.value }))} /></div>
                <div><label className="label">PIN Code</label><input className="input-field" value={form.pincode || ''} onChange={e => setForm((f: any) => ({ ...f, pincode: e.target.value }))} /></div>
              </div>
              <div><label className="label">Type</label><select className="input-field" value={form.type || 'individual'} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}><option value="individual">Individual</option><option value="corporate">Corporate</option></select></div>
              <div><label className="label">Description</label><textarea className="input-field" rows={3} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
              <button onClick={saveEdit} className="btn-primary">Save Changes</button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Name:</span> {customer.name}</div>
              <div><span className="text-gray-500">Email:</span> {customer.email}</div>
              <div><span className="text-gray-500">Mobile:</span> {customer.mobile || '-'}</div>
              <div><span className="text-gray-500">WhatsApp:</span> {customer.whatsapp || '-'}</div>
              <div><span className="text-gray-500">Designation:</span> {customer.designation || '-'}</div>
              <div><span className="text-gray-500">Company:</span> {customer.company || '-'}</div>
              <div><span className="text-gray-500">Website:</span> {customer.website || '-'}</div>
              <div><span className="text-gray-500">Address:</span> {customer.address || '-'}</div>
              <div><span className="text-gray-500">City:</span> {customer.city || '-'}</div>
              <div><span className="text-gray-500">State:</span> {customer.state || '-'}</div>
              <div><span className="text-gray-500">PIN Code:</span> {customer.pincode || '-'}</div>
              <div><span className="text-gray-500">Type:</span> <span className="px-2 py-0.5 rounded text-xs bg-gray-100">{customer.type}</span></div>
              <div><span className="text-gray-500">Description:</span> {customer.description || '-'}</div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-3">Card</h2>
            {customer.card ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Card ID:</span> <span className="font-mono font-bold text-primary-600">{customer.card.cardId}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${customer.card.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{customer.card.status}</span></div>
                <div><Link href={`/admin/cards/${customer.card.id}`} className="text-primary-600 text-sm hover:underline">View Card →</Link></div>
              </div>
            ) : <p className="text-gray-500 text-sm">No card assigned</p>}
          </div>
          <div className="card">
            <h2 className="font-semibold mb-3">Social Links</h2>
            {Object.keys(socialLinks).length > 0 ? (
              <div className="space-y-1 text-sm">{Object.entries(socialLinks).map(([k, v]) => <div key={k}><span className="text-gray-500 capitalize">{k}:</span> <a href={v as string} target="_blank" className="text-primary-600 hover:underline">{v as string}</a></div>)}</div>
            ) : <p className="text-gray-500 text-sm">No social links</p>}
          </div>
          <div className="card">
            <h2 className="font-semibold mb-3">Photos ({photos.length})</h2>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square">
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">No photos uploaded</p>}
          </div>
          <div className="card">
            <h2 className="font-semibold mb-3">Referred By</h2>
            {customer.employee ? (
              <div className="text-sm"><Link href={`/admin/employees/${customer.employee.id}`} className="text-primary-600 hover:underline">{customer.employee.name}</Link> <span className="text-gray-400">({customer.employee.employeeId})</span></div>
            ) : <p className="text-gray-500 text-sm">Direct (no referral)</p>}
          </div>
        </div>
      </div>

      {/* Orders */}
      {customer.orders?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Orders ({customer.orders.length})</h2>
          <table className="w-full text-sm">
            <thead className="border-b"><tr>
              <th className="text-left p-2 font-medium text-gray-600">Order ID</th>
              <th className="text-left p-2 font-medium text-gray-600">Amount</th>
              <th className="text-left p-2 font-medium text-gray-600">Status</th>
              <th className="text-left p-2 font-medium text-gray-600">Date</th>
            </tr></thead>
            <tbody className="divide-y">
              {customer.orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-2 font-mono"><Link href={`/admin/orders/${o.id}`} className="text-primary-600 hover:underline">{o.orderId}</Link></td>
                  <td className="p-2">₹{o.amount}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></td>
                  <td className="p-2 text-gray-600">{new Date(o.orderDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}