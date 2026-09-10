"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

async function uploadFile(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('File too large. Max size is 20MB.')
  }
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Upload failed')
  return data.url
}

async function downloadPhoto(customerId: string, index: number) {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/admin/customers/${customerId}/photos?index=${index}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="(.+)"/)
  const filename = filenameMatch ? filenameMatch[1] : `photo-${index + 1}.jpg`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [editSocial, setEditSocial] = useState<Record<string, string>>({})
  const [editPhotos, setEditPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState('')
  const [msg, setMsg] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/admin/customers/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setCustomer(d.data); setForm(d.data) } setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  function parsePhotos(str: string): string[] {
    try { return JSON.parse(str || '[]') } catch { return [] }
  }

  function parseSocial(str: string): Record<string, string> {
    try { return JSON.parse(str || '{}') } catch { return {} }
  }

  function startEdit() {
    setEditSocial(parseSocial(customer.socialLinks))
    setEditPhotos(parsePhotos(customer.photos))
    setForm(customer)
    setEditing(true)
    setMsg('')
  }

  function addPhoto(url: string) {
    setEditPhotos(p => (p.length >= 3 ? p : [...p, url]))
  }

  function removePhoto(index: number) {
    setEditPhotos(p => p.filter((_, i) => i !== index))
  }

  async function saveEdit() {
    const token = localStorage.getItem('token')
    const payload = {
      ...form,
      socialLinks: editSocial,
      photos: editPhotos,
    }
    const res = await fetch(`/api/admin/customers/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
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

  async function assignNfcNumber() {
    if (!customer?.card?.id) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/cards/${customer.card.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignNfcNumber: true }),
    })
    const d = await res.json()
    if (d.success && !d.data.alreadyAssigned) {
      setCustomer((c: any) => ({ ...c, card: { ...c.card, nfcCardNumber: d.data.nfcCardNumber } }))
      setMsg('NFC Card Number assigned!')
    } else if (d.data?.alreadyAssigned) {
      setCustomer((c: any) => ({ ...c, card: { ...c.card, nfcCardNumber: d.data.nfcCardNumber } }))
      setMsg('NFC Card Number already assigned.')
    } else setMsg(d.error || 'Failed')
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found.</div>

  const socialLinks = parseSocial(customer.socialLinks)
  const photos = parsePhotos(customer.photos)

  const socialFields = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'twitter', label: 'Twitter / X' },
    { id: 'youtube', label: 'YouTube' },
  ]

  const photoUploadBox = (label: string, key: string, previewUrl: string | undefined, currentUrl: string, setter: (url: string) => void) => (
    <div>
      <label className="label">{label}</label>
      {uploadMsg && uploadMsg.startsWith(label) && <p className={`text-xs mb-1.5 ${uploadMsg.includes('failed') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
      <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading === key ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) {
            setUploading(key)
            setUploadMsg('')
            try {
              const url = await uploadFile(file)
              setter(url)
              setUploadMsg(`${label} uploaded successfully!`)
              setTimeout(() => setUploadMsg(''), 3000)
            } catch (err: any) {
              setUploadMsg(`${label} upload failed: ` + (err.message || 'Please try again.'))
              setTimeout(() => setUploadMsg(''), 5000)
            }
            setUploading(null)
          }
        }} />
        {uploading === key ? (
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
        ) : previewUrl ? (
          <img src={previewUrl} alt={label} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
          </div>
        )}
        <span className="text-sm text-gray-500">{uploading === key ? 'Uploading...' : previewUrl ? 'Change' : 'Upload'}</span>
      </label>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/customers" className="text-sm text-primary-600 hover:underline">← Back to Customers</Link>
          <h1 className="text-2xl font-bold mt-1">{customer.name}</h1>
          <p className="text-gray-500 text-sm">{customer.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => editing ? setEditing(false) : startEdit()} className="btn-secondary text-sm">{editing ? 'Cancel' : 'Edit'}</button>
          <button onClick={deleteCustomer} className="btn-danger text-sm">Delete</button>
        </div>
      </div>

      {msg && <div className={`p-3 rounded-lg mb-4 text-sm ${msg === 'Saved!' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

      {editing ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <h2 className="font-semibold">Edit Profile</h2>
            <div><label className="label">Name</label><input className="input-field" value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">Email</label><input className="input-field" value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">Mobile</label><input className="input-field" value={form.mobile || ''} onChange={e => setForm((f: any) => ({ ...f, mobile: e.target.value }))} /></div>
            <div><label className="label">WhatsApp</label><input className="input-field" value={form.whatsapp || ''} onChange={e => setForm((f: any) => ({ ...f, whatsapp: e.target.value }))} /></div>
            <div><label className="label">Designation</label><input className="input-field" value={form.designation || ''} onChange={e => setForm((f: any) => ({ ...f, designation: e.target.value }))} /></div>
            <div><label className="label">Company</label><input className="input-field" value={form.company || ''} onChange={e => setForm((f: any) => ({ ...f, company: e.target.value }))} /></div>
            <div><label className="label">University / College</label><input className="input-field" value={form.college || ''} onChange={e => setForm((f: any) => ({ ...f, college: e.target.value }))} /></div>
            <div><label className="label">Website</label><input className="input-field" value={form.website || ''} onChange={e => setForm((f: any) => ({ ...f, website: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">City</label><input className="input-field" value={form.city || ''} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
              <div><label className="label">State</label><input className="input-field" value={form.state || ''} onChange={e => setForm((f: any) => ({ ...f, state: e.target.value }))} /></div>
              <div><label className="label">PIN Code</label><input className="input-field" value={form.pincode || ''} onChange={e => setForm((f: any) => ({ ...f, pincode: e.target.value }))} /></div>
            </div>
            <div className="md:col-span-2"><label className="label">Address</label><input className="input-field" value={form.address || ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} placeholder="Flat/House No., Building, Street" /></div>
            <div><label className="label">Type</label><select className="input-field" value={form.type || 'individual'} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}><option value="individual">Individual</option><option value="corporate">Corporate</option></select></div>
            <div className="md:col-span-2"><label className="label">UPI ID</label><input className="input-field" value={form.upiId || ''} onChange={e => setForm((f: any) => ({ ...f, upiId: e.target.value }))} placeholder="name@upi" /></div>
            <div className="md:col-span-2"><label className="label">Description</label><textarea className="input-field" rows={3} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <div className="space-y-6">
            <div className="card space-y-3">
              <h2 className="font-semibold">Social Links</h2>
              {socialFields.map(s => (
                <div key={s.id}><label className="label">{s.label}</label><input className="input-field" placeholder="username" value={editSocial[s.id] || ''} onChange={e => setEditSocial((prev: any) => ({ ...prev, [s.id]: e.target.value }))} /></div>
              ))}
            </div>
            <div className="card space-y-3">
              <h2 className="font-semibold">Logo / Profile Picture</h2>
              {photoUploadBox('Logo', 'logo', form.logoUrl, form.logoUrl, url => setForm((f: any) => ({ ...f, logoUrl: url })))}
              {!form.logoUrl && (
                <p className="text-xs text-gray-400">If you don't have a logo, upload a profile picture</p>
              )}
            </div>
            <div className="card space-y-3">
              <h2 className="font-semibold">Payment QR Code (UPI)</h2>
              {photoUploadBox('Payment QR', 'qr', form.paymentQrUrl, form.paymentQrUrl, url => setForm((f: any) => ({ ...f, paymentQrUrl: url })))}
            </div>
            <div className="card space-y-3">
              <h2 className="font-semibold">Photos (max 3)</h2>
              {uploadMsg && uploadMsg.startsWith('Photo') && <p className={`text-xs ${uploadMsg.includes('failed') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
              <div className="grid grid-cols-3 gap-3">
                {editPhotos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-24 rounded-lg object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">&times;</button>
                  </div>
                ))}
              </div>
              {editPhotos.length < 3 && (
                <label className="flex flex-col items-center justify-center gap-1 w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary-400">
                  <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploading('photo')
                      setUploadMsg('')
                      try {
                        const url = await uploadFile(file)
                        addPhoto(url)
                        setUploadMsg(`Photo ${editPhotos.length + 1} uploaded successfully!`)
                        setTimeout(() => setUploadMsg(''), 3000)
                      } catch (err: any) {
                        setUploadMsg('Photo upload failed: ' + (err.message || 'Please try again.'))
                        setTimeout(() => setUploadMsg(''), 5000)
                      }
                      setUploading(null)
                    }
                  }} />
                  {uploading === 'photo' ? (
                    <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  )}
                  <span className="text-xs text-gray-400">{uploading === 'photo' ? 'Uploading...' : `Add Photo ${editPhotos.length + 1}`}</span>
                </label>
              )}
            </div>
            <button onClick={saveEdit} className="btn-primary w-full">Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="font-semibold mb-3">Profile</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Name:</span> {customer.name}</div>
              <div><span className="text-gray-500">Email:</span> {customer.email}</div>
              <div><span className="text-gray-500">Mobile:</span> {customer.mobile || '-'}</div>
              <div><span className="text-gray-500">WhatsApp:</span> {customer.whatsapp || '-'}</div>
              <div><span className="text-gray-500">Designation:</span> {customer.designation || '-'}</div>
              <div><span className="text-gray-500">Company:</span> {customer.company || '-'}</div>
              <div><span className="text-gray-500">College:</span> {customer.college || '-'}</div>
              <div><span className="text-gray-500">Website:</span> {customer.website || '-'}</div>
              <div><span className="text-gray-500">Address:</span> {customer.address || '-'}</div>
              <div><span className="text-gray-500">City:</span> {customer.city || '-'}</div>
              <div><span className="text-gray-500">State:</span> {customer.state || '-'}</div>
              <div><span className="text-gray-500">PIN Code:</span> {customer.pincode || '-'}</div>
              <div><span className="text-gray-500">UPI ID:</span> {customer.upiId || '-'}</div>
              <div><span className="text-gray-500">Type:</span> <span className="px-2 py-0.5 rounded text-xs bg-gray-100">{customer.type}</span></div>
              <div><span className="text-gray-500">Description:</span> {customer.description || '-'}</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <h2 className="font-semibold mb-3">Card</h2>
              {customer.card ? (
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Card ID:</span> <span className="font-mono font-bold text-primary-600">{customer.card.cardId}</span></div>
                  {customer.card.nfcCardNumber && (
                    <>
                      <div><span className="text-gray-500">NFC Card Number:</span> <span className="font-mono font-bold text-primary-600">{customer.card.nfcCardNumber}</span></div>
                      <div>
                        <span className="text-gray-500">NFC URL:</span>{' '}
                        <span className="font-mono text-xs text-primary-600 break-all">{typeof window !== 'undefined' ? window.location.origin : 'https://www.mysmartcard.net'}/card/{customer.card.nfcCardNumber}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/card/${customer.card.nfcCardNumber}`); alert('NFC URL copied!') }}
                          className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded hover:bg-primary-200 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </>
                  )}
                  {!customer.card.nfcCardNumber && (
                    <div>
                      <button onClick={assignNfcNumber} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors font-medium mt-1">
                        Generate NFC Card Number
                      </button>
                    </div>
                  )}
                  <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${customer.card.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{customer.card.status}</span></div>
                  <div><Link href={`/admin/cards/${customer.card.id}`} className="text-primary-600 text-sm hover:underline">View Card →</Link></div>
                </div>
              ) : <p className="text-gray-500 text-sm">No card assigned</p>}
            </div>
            <div className="card">
              <h2 className="font-semibold mb-3">Social Links</h2>
              {Object.keys(socialLinks).filter(k => socialLinks[k]).length > 0 ? (
                <div className="space-y-1 text-sm">{Object.entries(socialLinks).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-gray-500 capitalize">{k}:</span> <a href={v as string} target="_blank" className="text-primary-600 hover:underline">{v as string}</a></div>)}</div>
              ) : <p className="text-gray-500 text-sm">No social links</p>}
            </div>
            {customer.logoUrl && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Logo</h2>
                  <button
                    onClick={async () => {
                      setDownloading('logo')
                      try {
                        const token = localStorage.getItem('token')
                        const res = await fetch(`/api/admin/customers/${customer.id}/photos?index=-1`, {
                          headers: { Authorization: `Bearer ${token}` },
                        })
                        if (res.ok) {
                          const blob = await res.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'logo.jpg'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }
                      } catch {}
                      setDownloading(null)
                    }}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Download Logo
                  </button>
                </div>
                <img src={customer.logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
              </div>
            )}
            {customer.paymentQrUrl && (
              <div className="card">
                <h2 className="font-semibold mb-3">Payment QR Code</h2>
                <img src={customer.paymentQrUrl} alt="Payment QR" className="w-24 h-24 rounded-xl object-contain bg-white border border-gray-100" />
              </div>
            )}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Photos ({photos.length})</h2>
                {photos.length > 0 && (
                  <button
                    onClick={async () => {
                      setDownloading('all')
                      try {
                        for (let i = 0; i < photos.length; i++) {
                          await downloadPhoto(customer.id, i)
                          await new Promise(r => setTimeout(r, 300))
                        }
                      } catch { alert('Some photos failed to download') }
                      setDownloading(null)
                    }}
                    disabled={downloading === 'all'}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {downloading === 'all' ? 'Downloading...' : 'Download All'}
                  </button>
                )}
              </div>
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                      <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => downloadPhoto(customer.id, i)}
                        className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Save
                      </button>
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
      )}

      {/* Orders */}
      {customer.orders?.length > 0 && !editing && (
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