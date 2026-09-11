"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

import { compressImage } from '@/lib/compress-image'

async function uploadFile(file: File): Promise<string> {
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('file', compressed)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error('Upload failed: server returned an invalid response.') }
  if (!data.success) throw new Error(data.error || 'Upload failed')
  return data.url
}

function AdminNewOrderContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', designation: '', company: '', college: '',
    whatsapp: '', website: '', address: '', taluk: '', city: '', state: '', pincode: '',
    instagram: '', facebook: '', linkedin: '',
    logoUrl: '', paymentQrUrl: '', description: '',
    photo1: '', photo2: '', photo3: '',
    designId: '', employeeId: '', amount: '',
  })

  const [designs, setDesigns] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/designs')
      .then(r => r.json())
      .then(d => { if (d.success) setDesigns(d.data) })
      .catch(() => {})
    fetch('/api/admin/employees', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setEmployees(d.data.filter((e: any) => e.status === 'active')) })
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
      const photos = [form.photo1, form.photo2, form.photo3].filter(p => p.trim())

      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, email: form.email, mobile: form.mobile,
          designation: form.designation, company: form.company, college: form.college,
          whatsapp: form.whatsapp || form.mobile, website: form.website,
          address: form.address, taluk: form.taluk, city: form.city, state: form.state, pincode: form.pincode,
          socialLinks: { instagram: form.instagram, facebook: form.facebook, linkedin: form.linkedin },
          logoUrl: form.logoUrl, paymentQrUrl: form.paymentQrUrl, description: form.description, photos,
          designId: form.designId,
          employeeId: form.employeeId || null,
          amount: form.amount ? parseFloat(form.amount) : undefined,
        }),
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error('Server returned an invalid response. The request may be too large — try using smaller images.') }
      if (!data.success) throw new Error(data.error)
      alert(`Order created successfully!\nOrder ID: ${data.data.orderId}\nCard ID: ${data.data.cardId}`)
      router.push('/admin/orders?status=confirmed')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedDesign = designs.find(d => d.id === form.designId)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create Order</h1>
          <p className="text-gray-500 text-sm">Register a customer, generate their card, and confirm the order directly — no online payment required.</p>
        </div>
        <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline font-medium">← Back to Orders</Link>
      </div>

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
            <div><label className="label">Taluk</label><input className="input-field" value={form.taluk} onChange={e => update('taluk', e.target.value)} /></div>
            <div><label className="label">City</label><input className="input-field" value={form.city} onChange={e => update('city', e.target.value)} /></div>
            <div><label className="label">State</label><input className="input-field" value={form.state} onChange={e => update('state', e.target.value)} /></div>
            <div><label className="label">PIN Code</label><input className="input-field" value={form.pincode} onChange={e => update('pincode', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Social Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="label">Instagram</label><input className="input-field" placeholder="username" value={form.instagram} onChange={e => update('instagram', e.target.value)} /></div>
            <div><label className="label">Facebook</label><input className="input-field" placeholder="username" value={form.facebook} onChange={e => update('facebook', e.target.value)} /></div>
            <div><label className="label">LinkedIn</label><input className="input-field" placeholder="username" value={form.linkedin} onChange={e => update('linkedin', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Profile & Branding</h2>
          {uploadMsg && uploadMsg.startsWith('Logo') && <p className={`text-xs ${uploadMsg.includes('failed') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading === 'logo' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                setUploading('logo')
                setUploadMsg('')
                try {
                  const url = await uploadFile(file)
                  update('logoUrl', url)
                  setUploadMsg('Logo uploaded successfully!')
                  setTimeout(() => setUploadMsg(''), 3000)
                } catch (err: any) {
                  setUploadMsg('Logo upload failed: ' + (err.message || 'Please try again.'))
                  setTimeout(() => setUploadMsg(''), 5000)
                }
                setUploading(null)
              }
            }} />
            {uploading === 'logo' ? (
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              </div>
            ) : form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{uploading === 'logo' ? 'Uploading...' : form.logoUrl ? 'Change logo' : "If you don't have a logo, upload a profile picture"}</span>
          </label>
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading === 'qr' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                setUploading('qr')
                setUploadMsg('')
                try {
                  const url = await uploadFile(file)
                  update('paymentQrUrl', url)
                  setUploadMsg('Payment QR uploaded successfully!')
                  setTimeout(() => setUploadMsg(''), 3000)
                } catch (err: any) {
                  setUploadMsg('Payment QR upload failed: ' + (err.message || 'Please try again.'))
                  setTimeout(() => setUploadMsg(''), 5000)
                }
                setUploading(null)
              }
            }} />
            {uploading === 'qr' ? (
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              </div>
            ) : form.paymentQrUrl ? (
              <img src={form.paymentQrUrl} alt="Payment QR" className="w-12 h-12 rounded-lg object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{uploading === 'qr' ? 'Uploading...' : form.paymentQrUrl ? 'Change payment QR' : 'Upload UPI payment QR code'}</span>
          </label>
          <div><label className="label">Description / Bio</label><textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell people about yourself or your business..." /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Photos</h2>
          <p className="text-xs text-gray-400">Upload up to 3 photos for the digital profile card</p>
          {uploadMsg && uploadMsg.startsWith('Photo') && <p className={`text-xs ${uploadMsg.includes('fail') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          <div className="grid grid-cols-3 gap-4">
            {(['photo1', 'photo2', 'photo3'] as const).map((field, idx) => (
              <label key={field} className={`flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading === field ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploading(field)
                    setUploadMsg('')
                    try {
                      const url = await uploadFile(file)
                      update(field, url)
                      setUploadMsg(`Photo ${idx + 1} uploaded successfully!`)
                      setTimeout(() => setUploadMsg(''), 3000)
                    } catch (err: any) {
                      setUploadMsg(`Photo ${idx + 1} upload failed: ` + (err.message || 'Please try again.'))
                      setTimeout(() => setUploadMsg(''), 5000)
                    }
                    setUploading(null)
                  }
                }} />
                {uploading === field ? (
                  <div className="w-full h-32 rounded-lg bg-primary-100 flex flex-col items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-primary-600 mb-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span className="text-xs text-primary-600">Uploading...</span>
                  </div>
                ) : (form as any)[field] ? (
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
          <h2 className="font-semibold">Order Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Select Card Design *</label>
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
                {designs.length === 0 && <p className="text-sm text-gray-400">Loading designs...</p>}
              </div>
            </div>
            <div><label className="label">Amount (₹)</label><input className="input-field" type="number" min="0" step="0.01" placeholder={`Default ₹${selectedDesign?.price || '—'}`} value={form.amount} onChange={e => update('amount', e.target.value)} /></div>
            <div>
              <label className="label">Sales Employee (optional)</label>
              <select className="input-field" value={form.employeeId} onChange={e => update('employeeId', e.target.value)}>
                <option value="">Direct (No employee)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.employeeId}</option>
                ))}
              </select>
            </div>
          </div>
          {form.employeeId && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-xs text-primary-800">
              Commission points and amount will be credited to this employee when the order is created.
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating Order & Card...' : 'Create Order & Generate Card'}
        </button>
      </form>
    </div>
  )
}

export default function AdminNewOrderPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>}>
      <AdminNewOrderContent />
    </Suspense>
  )
}