"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Upload failed')
  return data.url
}

export default function EmployeeNewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employee, setEmployee] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', designation: '', company: '', college: '',
    whatsapp: '', website: '', address: '', city: '', state: '', pincode: '',
    instagram: '', facebook: '', linkedin: '',
    logoUrl: '', description: '',
    photo1: '', photo2: '', photo3: '', photo4: '',
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

      const photos = [form.photo1, form.photo2, form.photo3, form.photo4].filter(p => p.trim())

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, mobile: form.mobile,
          designation: form.designation, company: form.company, college: form.college,
          whatsapp: form.whatsapp || form.mobile, website: form.website,
          address: form.address, city: form.city, state: form.state, pincode: form.pincode,
          socialLinks: { instagram: form.instagram, facebook: form.facebook, linkedin: form.linkedin },
          logoUrl: form.logoUrl, description: form.description, photos,
          designId: form.designId, referralCode, attributionType: 'link',
        }),
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
            <div><label className="label">University / College</label><input className="input-field" value={form.college} onChange={e => update('college', e.target.value)} /></div>
            <div><label className="label">Website</label><input className="input-field" value={form.website} onChange={e => update('website', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Address</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Address</label><input className="input-field" value={form.address} onChange={e => update('address', e.target.value)} /></div>
            <div><label className="label">City</label><input className="input-field" value={form.city} onChange={e => update('city', e.target.value)} /></div>
            <div><label className="label">State</label><input className="input-field" value={form.state} onChange={e => update('state', e.target.value)} /></div>
            <div><label className="label">PIN Code</label><input className="input-field" value={form.pincode} onChange={e => update('pincode', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Social Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="label">Instagram</label><input className="input-field" placeholder="@username" value={form.instagram} onChange={e => update('instagram', e.target.value)} /></div>
            <div><label className="label">Facebook</label><input className="input-field" placeholder="facebook.com/username" value={form.facebook} onChange={e => update('facebook', e.target.value)} /></div>
            <div><label className="label">LinkedIn</label><input className="input-field" placeholder="linkedin.com/in/username" value={form.linkedin} onChange={e => update('linkedin', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Profile & Branding</h2>
          <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                const url = await uploadFile(file)
                update('logoUrl', url)
              }
            }} />
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{form.logoUrl ? 'Change logo' : 'Upload logo'}</span>
          </label>
          <div><label className="label">Description / Bio</label><textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell people about yourself or your business..." /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Photos</h2>
          <p className="text-xs text-gray-400">Upload 3-4 photos for the digital profile card</p>
          <div className="grid grid-cols-2 gap-4">
            {(['photo1', 'photo2', 'photo3', 'photo4'] as const).map((field, idx) => (
              <label key={field} className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = await uploadFile(file)
                    update(field, url)
                  }
                }} />
                {(form as any)[field] ? (
                  <img src={(form as any)[field]} alt={`Photo ${idx + 1}`} className="w-full h-32 rounded-lg object-cover" />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                    <span className="text-xs text-gray-400">Photo {idx + 1}</span>
                  </div>
                )}
              </label>
            ))}
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
