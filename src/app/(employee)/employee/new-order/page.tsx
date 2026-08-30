"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeNewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employee, setEmployee] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', designation: '', company: '',
    whatsapp: '', website: '', location: '', upiId: '',
    designId: '',
  })

  const [designs, setDesigns] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/employee/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setEmployee(d.data) })
      .catch(() => {})
    fetch('/api/designs')
      .then(r => r.json())
      .then(d => { if (d.success) setDesigns(d.data) })
      .catch(() => {})
  }, [])

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.designId) {
      setError('Name, email, and design are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const meRes = await fetch('/api/employee/me', { headers: { Authorization: `Bearer ${token}` } })
      const meData = await meRes.json()
      const referralCode = meData.data?.referralLinkCode

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referralCode, attributionType: 'link' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      alert(`Order created! Card ID: ${data.data.cardId}\nCommission: ${data.data.commissionPoints} points`)
      router.push('/employee/orders')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const referralUrl = employee ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${employee.referralLinkCode}` : ''

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Register New Customer</h1>

      {/* Shareable Link Box */}
      {employee && (
        <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <h2 className="font-semibold text-primary-800 mb-2">Your Shareable Referral Link</h2>
          <p className="text-sm text-gray-600 mb-3">Send this link to customers. When they order through it, the sale is attributed to you and you earn commission + points.</p>
          <div className="flex items-center gap-2 mb-3">
            <input readOnly value={referralUrl} className="input-field flex-1 text-sm bg-white" />
            <button
              onClick={() => { navigator.clipboard.writeText(referralUrl); alert('Link copied!') }}
              className="btn-primary whitespace-nowrap text-sm"
            >
              Copy Link
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Or share code: <span className="font-mono font-bold text-primary-600">{employee.referralLinkCode}</span></span>
            <span>•</span>
            <span>Customer can also enter this code manually at checkout</span>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Customer Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
            <div><label className="label">Email *</label><input className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
            <div><label className="label">Mobile</label><input className="input-field" value={form.mobile} onChange={e => update('mobile', e.target.value)} /></div>
            <div><label className="label">WhatsApp</label><input className="input-field" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} /></div>
            <div><label className="label">Designation</label><input className="input-field" value={form.designation} onChange={e => update('designation', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input-field" value={form.company} onChange={e => update('company', e.target.value)} /></div>
            <div><label className="label">Website</label><input className="input-field" value={form.website} onChange={e => update('website', e.target.value)} /></div>
            <div><label className="label">Location</label><input className="input-field" value={form.location} onChange={e => update('location', e.target.value)} /></div>
            <div><label className="label">UPI ID</label><input className="input-field" value={form.upiId} onChange={e => update('upiId', e.target.value)} placeholder="customer@upi" /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Select Card Design</h2>
          <div className="grid gap-3">
            {designs.map(d => (
              <label key={d.id} className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${form.designId === d.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="design" value={d.id} checked={form.designId === d.id} onChange={e => update('designId', e.target.value)} className="text-primary-600" />
                  <span className="font-medium">{d.name}</span>
                </div>
                <span className="font-bold">₹{d.price}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </form>
    </div>
  )
}
