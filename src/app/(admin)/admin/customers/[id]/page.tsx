"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { uploadFile } from '@/lib/upload-client'
import {
  MAX_USER_PHOTOS,
  MAX_ADMIN_PHOTOS,
  MAX_DOCUMENTS,
  formatFileSize,
} from '@/lib/profile-media'
import DragDropSortable from '@/components/DragDropSortable'

async function downloadPhoto(customerId: string, index: number, source: 'user' | 'admin' | 'all' = 'user') {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/admin/customers/${customerId}/photos?index=${index}&source=${source}`, {
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

async function triggerBlobDownload(url: string, fallbackName: string, auth = true) {
  const token = auth ? localStorage.getItem('token') : null
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="(.+)"/)
  const filename = filenameMatch ? filenameMatch[1] : fallbackName
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
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
  const [editAdminPhotos, setEditAdminPhotos] = useState<any[]>([])
  const [editDocs, setEditDocs] = useState<any[]>([])
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
    setEditAdminPhotos(parsePhotos(customer.adminPhotos).map((p: any) => typeof p === 'string' ? { url: p, visibility: 'public' } : p))
    setEditDocs(parsePhotos(customer.documents))
    setForm(customer)
    setEditing(true)
    setMsg('')
  }

  function addPhoto(url: string) {
    setEditPhotos(p => (p.length >= MAX_USER_PHOTOS ? p : [...p, url]))
  }

  function removePhoto(index: number) {
    setEditPhotos(p => p.filter((_, i) => i !== index))
  }

  function replacePhoto(index: number, url: string) {
    setEditPhotos(p => p.map((item, i) => (i === index ? url : item)))
  }

  function addAdminPhoto(url: string) {
    setEditAdminPhotos(p => (p.length >= MAX_ADMIN_PHOTOS ? p : [...p, { url, visibility: 'public', createdAt: new Date().toISOString() }]))
  }

  function updateAdminPhoto(index: number, patch: any) {
    setEditAdminPhotos(p => p.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeAdminPhoto(index: number) {
    setEditAdminPhotos(p => p.filter((_, i) => i !== index))
  }

  function addDocument(entry: any) {
    setEditDocs(p => (p.length >= MAX_DOCUMENTS ? p : [...p, entry]))
  }

  function updateDocument(index: number, patch: any) {
    setEditDocs(p => p.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeDocument(index: number) {
    setEditDocs(p => p.filter((_, i) => i !== index))
  }

  async function saveEdit() {
    const token = localStorage.getItem('token')
    const payload = {
      ...form,
      socialLinks: editSocial,
      photos: editPhotos,
      adminPhotos: editAdminPhotos,
      documents: editDocs,
    }
    const res = await fetch(`/api/admin/customers/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    if (d.success) { setCustomer(d.data); setEditing(false); setMsg('Saved!') }
    else setMsg(d.error)
  }

  async function runUpload(key: string, file: File | undefined, label: string, kind: 'image' | 'document', onOk: (url: string) => void) {
    if (!file) return
    setUploading(key)
    setUploadMsg('')
    try {
      const url = await uploadFile(file, { kind })
      onOk(url)
      setUploadMsg(`${label} uploaded successfully!`)
      setTimeout(() => setUploadMsg(''), 3000)
    } catch (err: any) {
      setUploadMsg(`${label} upload failed: ` + (err.message || 'Please try again.'))
      setTimeout(() => setUploadMsg(''), 5000)
    } finally {
      setUploading(null)
    }
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
  const adminPhotos: any[] = parsePhotos(customer.adminPhotos).map((p: any) => (typeof p === 'string' ? { url: p, visibility: 'public' } : p))
  const documents: any[] = parsePhotos(customer.documents)

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className="label">Taluk</label><input className="input-field" value={form.taluk || ''} onChange={e => setForm((f: any) => ({ ...f, taluk: e.target.value }))} /></div>
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Customer Photos</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${editPhotos.length >= MAX_USER_PHOTOS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>{editPhotos.length} / {MAX_USER_PHOTOS}</span>
              </div>
              {uploadMsg && uploadMsg.startsWith('Customer Photo') && <p className={`text-xs ${uploadMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
              <div className="grid grid-cols-3 gap-3">
                {editPhotos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) runUpload(`photo-${i}`, f, `Customer Photo ${i + 1}`, 'image', (url) => replacePhoto(i, url))
                        e.target.value = ''
                      }} />
                      <img src={photo} alt={`Photo ${i + 1}`} className={`w-full h-24 rounded-lg object-cover bg-gray-100 transition-opacity ${uploading === `photo-${i}` ? 'opacity-40' : ''}`} />
                    </label>
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
                    <button onClick={() => removePhoto(i)} title="Remove" className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center">&times;</button>
                  </div>
                ))}
                {editPhotos.length < MAX_USER_PHOTOS && (
                  <label className="flex flex-col items-center justify-center gap-1 w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary-400">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) runUpload('photo-add', f, 'Customer Photo', 'image', (url) => addPhoto(url))
                      e.target.value = ''
                    }} />
                    {uploading === 'photo-add' ? (
                      <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    )}
                    <span className="text-xs text-gray-400">{uploading === 'photo-add' ? 'Uploading...' : 'Add Photo'}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Gallery Photos (Admin)</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${editAdminPhotos.length >= MAX_ADMIN_PHOTOS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>{editAdminPhotos.length} / {MAX_ADMIN_PHOTOS}</span>
              </div>
              <p className="text-xs text-gray-400 -mt-1">Photos you add here are shown on the customer's public profile together with their own photos. Drag to reorder, click to replace.</p>
              {uploadMsg && uploadMsg.startsWith('Gallery Photo') && <p className={`text-xs ${uploadMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
              <DragDropSortable
                items={editAdminPhotos}
                onReorder={setEditAdminPhotos}
                renderItem={(entry, i, isDragging) => (
                  <div className={`relative group ${isDragging ? 'opacity-50' : ''}`}>
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) runUpload(`adminPhoto-${i}`, f, `Gallery Photo ${i + 1}`, 'image', (url) => updateAdminPhoto(i, { url, createdAt: new Date().toISOString() }))
                        e.target.value = ''
                      }} />
                      <img src={entry.url} alt={`Gallery ${i + 1}`} className={`w-full h-24 rounded-lg object-cover bg-gray-100 transition-opacity ${uploading === `adminPhoto-${i}` ? 'opacity-40' : ''}`} />
                    </label>
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
                    <button
                      onClick={() => updateAdminPhoto(i, { visibility: entry.visibility === 'private' ? 'public' : 'private' })}
                      title="Toggle visibility"
                      className={`absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${entry.visibility === 'private' ? 'bg-gray-700 text-white' : 'bg-green-600 text-white'}`}
                    >{entry.visibility === 'private' ? 'Private' : 'Public'}</button>
                    <button onClick={() => removeAdminPhoto(i)} title="Remove" className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center">&times;</button>
                  </div>
                )}
                renderAddNew={() => (
                  editAdminPhotos.length < MAX_ADMIN_PHOTOS && (
                    <label className="flex flex-col items-center justify-center gap-1 w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary-400">
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) runUpload('adminPhoto-add', f, 'Gallery Photo', 'image', (url) => addAdminPhoto(url))
                        e.target.value = ''
                      }} />
                      {uploading === 'adminPhoto-add' ? (
                        <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      )}
                      <span className="text-xs text-gray-400">{uploading === 'adminPhoto-add' ? 'Uploading...' : 'Add Photo'}</span>
                    </label>
                  )
                )}
              />
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Documents (PDF)</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${editDocs.length >= MAX_DOCUMENTS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>{editDocs.length} / {MAX_DOCUMENTS}</span>
              </div>
              <p className="text-xs text-gray-400 -mt-1">Catalogs, price lists, brochures and certificates (PDF, max 10MB each). Public documents appear on the profile with a download button.</p>
              {uploadMsg && uploadMsg.startsWith('Document') && <p className={`text-xs ${uploadMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
              {editDocs.length > 0 && (
                <div className="space-y-2">
                  {editDocs.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">PDF</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(doc.size)} · {doc.visibility === 'private' ? 'Hidden from profile' : 'Public'}</p>
                      </div>
                      <label className={`text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${uploading === `doc-${i}` ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400'}`}>
                        <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) runUpload(`doc-${i}`, f, `Document ${i + 1}`, 'document', (url) => updateDocument(i, { url, name: f.name, size: f.size, createdAt: new Date().toISOString() }))
                          e.target.value = ''
                        }} />
                        {uploading === `doc-${i}` ? '...' : 'Replace'}
                      </label>
                      <button
                        onClick={() => updateDocument(i, { visibility: doc.visibility === 'private' ? 'public' : 'private' })}
                        className={`text-xs px-2.5 py-1 rounded-lg ${doc.visibility === 'private' ? 'bg-gray-700 text-white' : 'bg-green-100 text-green-700'}`}
                      >{doc.visibility === 'private' ? 'Private' : 'Public'}</button>
                      <button onClick={() => removeDocument(i)} title="Remove" className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">&times;</button>
                    </div>
                  ))}
                </div>
              )}
              {editDocs.length < MAX_DOCUMENTS && (
                <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary-400">
                  <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) runUpload('doc-add', f, 'Document', 'document', (url) => addDocument({ url, name: f.name, size: f.size, mime: 'application/pdf', visibility: 'public', createdAt: new Date().toISOString() }))
                    e.target.value = ''
                  }} />
                  {uploading === 'doc-add' ? (
                    <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5A1.125 1.125 0 0113.5 7.125v-4.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  )}
                  <span className="text-xs text-gray-400">{uploading === 'doc-add' ? 'Uploading...' : 'Upload PDF'}</span>
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
              <div><span className="text-gray-500">Taluk:</span> {customer.taluk || '-'}</div>
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
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">Gallery Photos ({photos.length + adminPhotos.length})</h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{photos.length} customer · {adminPhotos.length} admin</span>
                </div>
                {photos.length + adminPhotos.length > 0 && (
                  <button
                    onClick={async () => {
                      setDownloading('all')
                      try {
                        await triggerBlobDownload(`/api/admin/customers/${customer.id}/photos?all=true&zip=1&source=all`, `${customer.name || 'profile'}-photos.zip`)
                      } catch { alert('Download failed. Please try again.') }
                      setDownloading(null)
                    }}
                    disabled={downloading === 'all'}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {downloading === 'all' ? 'Preparing ZIP...' : 'Download All (ZIP)'}
                  </button>
                )}
              </div>
              {photos.length + adminPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <div key={`u-${i}`} className="relative group rounded-lg overflow-hidden aspect-square">
                      <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">User {i + 1}</span>
                      <button
                        onClick={() => downloadPhoto(customer.id, i, 'user')}
                        className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Save
                      </button>
                    </div>
                  ))}
                  {adminPhotos.map((entry: any, i: number) => (
                    <div key={`a-${i}`} className="relative group rounded-lg overflow-hidden aspect-square">
                      <img src={entry.url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-primary-600 text-white text-[9px] px-1.5 py-0.5 rounded">Admin {i + 1}</span>
                      {entry.visibility === 'private' && (
                        <span className="absolute top-1 right-1 bg-gray-700 text-white text-[9px] px-1.5 py-0.5 rounded">Private</span>
                      )}
                      <button
                        onClick={() => downloadPhoto(customer.id, i, 'admin')}
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
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h2 className="font-semibold">Documents ({documents.length})</h2>
                {documents.length > 0 && (
                  <button
                    onClick={async () => {
                      setDownloading('docs')
                      try {
                        await triggerBlobDownload(`/api/admin/customers/${customer.id}/documents?zip=1`, `${customer.name || 'profile'}-documents.zip`)
                      } catch { alert('Download failed. Please try again.') }
                      setDownloading(null)
                    }}
                    disabled={downloading === 'docs'}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {downloading === 'docs' ? 'Preparing ZIP...' : 'Download All (ZIP)'}
                  </button>
                )}
              </div>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">PDF</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(doc.size)} · {doc.visibility === 'private' ? 'Hidden from profile' : 'Public'}</p>
                      </div>
                      <a
                        href={`/api/admin/customers/${customer.id}/documents?index=${i}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg hover:border-primary-400 transition-colors"
                      >View</a>
                      <button
                        onClick={async () => {
                          setDownloading(`doc-${i}`)
                          try {
                            await triggerBlobDownload(`/api/admin/customers/${customer.id}/documents?index=${i}&download=1`, doc.name || 'document.pdf')
                          } catch { alert('Download failed') }
                          setDownloading(null)
                        }}
                        disabled={downloading === `doc-${i}`}
                        className="text-xs bg-primary-600 text-white px-2.5 py-1 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        {downloading === `doc-${i}` ? '...' : 'Download'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm">No documents uploaded. Use Edit to add PDFs.</p>}
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