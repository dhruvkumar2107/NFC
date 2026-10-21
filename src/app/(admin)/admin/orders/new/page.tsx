"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

import { compressImage } from '@/lib/compress-image'
import { apiFetch } from '@/lib/api-client'
import { uploadFile as uploadWithProgress } from '@/lib/upload-client'
import { MAX_ADMIN_PHOTOS, MAX_ORDER_DOCUMENTS, MAX_VIDEOS } from '@/lib/profile-media'

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function uploadErrorMessage(status: number, fallback?: string): string {
  switch (status) {
    case 401: return 'Your session has expired. Please log out and log in again, then retry the upload.'
    case 403: return fallback || 'You do not have permission to upload this file.'
    case 413: return fallback || 'File is too large. PDF documents must be 10MB or smaller.'
    case 415: return fallback || 'Unsupported file type. Please upload a valid PDF document.'
    case 422: return fallback || 'The file failed validation. Please check it and try again.'
    case 500: return fallback || 'The server could not process the upload. Please try again.'
    default: return fallback || `Upload failed (${status}).`
  }
}

async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('kind', 'image')
  const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: formData })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error('Upload failed: server returned an invalid response.') }
  if (!data.success) throw new Error(uploadErrorMessage(res.status, data.error))
  return data.url
}

function AdminNewOrderContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [docProgress, setDocProgress] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', designation: '', company: '', college: '',
    whatsapp: '', website: '', address: '', taluk: '', city: '', state: '', pincode: '',
    instagram: '', facebook: '', linkedin: '',
    logoUrl: '', paymentQrUrl: '', description: '',
    adminPhotos: [] as string[],
    documents: [] as { url: string; name: string; size: number }[],
    videos: [] as { url: string; name: string; size: number; mime: string }[],
    designId: '', employeeId: '', amount: '',
  })

  const [designs, setDesigns] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/designs')
      .then(r => r.json())
      .then(d => { if (d.success) setDesigns(d.data) })
      .catch(() => {})
    apiFetch('/api/admin/employees')
      .then((d: any) => { if (d.success) setEmployees(d.data.filter((e: any) => e.status === 'active')) })
      .catch(() => {})
  }, [])

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.mobile || !form.designId) {
      setError('Name, mobile number, and design are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')

      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, email: form.email, mobile: form.mobile,
          designation: form.designation, company: form.company, college: form.college,
          whatsapp: form.whatsapp || form.mobile, website: form.website,
          address: form.address, taluk: form.taluk, city: form.city, state: form.state, pincode: form.pincode,
          socialLinks: { instagram: form.instagram, facebook: form.facebook, linkedin: form.linkedin },
          logoUrl: form.logoUrl, paymentQrUrl: form.paymentQrUrl, description: form.description,
          adminPhotos: form.adminPhotos,
          documents: form.documents,
          videos: form.videos,
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
            <div><label className="label">Mobile *</label><input className="input-field" value={form.mobile} onChange={e => update('mobile', e.target.value)} required /></div>
            <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
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
                  const url = await uploadImage(file)
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
                  const url = await uploadImage(file)
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Gallery Photos (Admin)</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.adminPhotos.length >= MAX_ADMIN_PHOTOS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
              {form.adminPhotos.length} / {MAX_ADMIN_PHOTOS}
            </span>
          </div>
          <p className="text-xs text-gray-400 -mt-1">Upload up to {MAX_ADMIN_PHOTOS} photos for the customer's public profile gallery. Click a photo to replace it.</p>
          {uploadMsg && uploadMsg.startsWith('Gallery Photo') && <p className={`text-xs ${uploadMsg.includes('fail') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          <div className="grid grid-cols-3 gap-3">
            {form.adminPhotos.map((photo, i) => (
              <label key={i} className="relative group flex flex-col items-center gap-2 p-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-primary-400">
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploading(`adminPhoto-${i}`)
                    setUploadMsg('')
                    try {
                      const url = await uploadImage(file)
                      setForm(f => ({ ...f, adminPhotos: f.adminPhotos.map((p, idx) => idx === i ? url : p) }))
                      setUploadMsg(`Gallery Photo ${i + 1} uploaded successfully!`)
                      setTimeout(() => setUploadMsg(''), 3000)
                    } catch (err: any) {
                      setUploadMsg(`Gallery Photo ${i + 1} upload failed: ` + (err.message || 'Please try again.'))
                      setTimeout(() => setUploadMsg(''), 5000)
                    }
                    setUploading(null)
                  }
                }} />
                {uploading === `adminPhoto-${i}` ? (
                  <div className="w-full h-24 rounded-lg bg-primary-100 flex flex-col items-center justify-center">
                    <svg className="animate-spin h-6 w-6 text-primary-600 mb-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span className="text-xs text-primary-600">Uploading...</span>
                  </div>
                ) : (
                  <img src={photo} alt={`Gallery ${i + 1}`} className="w-full h-24 rounded-lg object-cover" />
                )}
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, adminPhotos: f.adminPhotos.filter((_, idx) => idx !== i) }))} title="Remove" className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center">&times;</button>
              </label>
            ))}
            {form.adminPhotos.length < MAX_ADMIN_PHOTOS && (
              <label className="flex flex-col items-center justify-center gap-1 w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary-400">
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploading('adminPhoto-add')
                    setUploadMsg('')
                    try {
                      const url = await uploadImage(file)
                      setForm(f => ({ ...f, adminPhotos: [...f.adminPhotos, url] }))
                      setUploadMsg('Gallery Photo uploaded successfully!')
                      setTimeout(() => setUploadMsg(''), 3000)
                    } catch (err: any) {
                      setUploadMsg('Gallery Photo upload failed: ' + (err.message || 'Please try again.'))
                      setTimeout(() => setUploadMsg(''), 5000)
                    }
                    setUploading(null)
                  }
                }} />
                {uploading === 'adminPhoto-add' ? (
                  <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                )}
                <span className="text-xs text-gray-400">{uploading === 'adminPhoto-add' ? 'Uploading...' : 'Add Photo'}</span>
              </label>
            )}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Videos</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.videos.length >= MAX_VIDEOS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
              {form.videos.length} / {MAX_VIDEOS}
            </span>
          </div>
          <p className="text-xs text-gray-400 -mt-1">Upload up to {MAX_VIDEOS} videos (MP4, WebM or MOV, max 50MB each). Videos play on the customer&apos;s public NFC card page.</p>
          {uploadMsg && uploadMsg.startsWith('Video') && <p className={`text-xs ${uploadMsg.includes('fail') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          {form.videos.length > 0 && (
            <div className="space-y-2">
              {form.videos.map((video, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">MP4</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate" title={video.name}>{video.name}</p>
                    <p className="text-xs text-gray-400">{(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <label className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${uploading === `video-${i}` ? 'bg-primary-100 text-primary-700' : `cursor-pointer bg-white border border-gray-200 text-gray-600 hover:border-primary-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}`}>
                    <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="sr-only" disabled={uploading !== null} onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (file) {
                        setUploading(`video-${i}`)
                        setVideoProgress(0)
                        setUploadMsg('')
                        try {
                          const url = await uploadWithProgress(file, { kind: 'video', onProgress: setVideoProgress })
                          setForm(f => ({ ...f, videos: f.videos.map((v, idx) => idx === i ? { url, name: file.name, size: file.size, mime: file.type || 'video/mp4' } : v) }))
                          setUploadMsg(`Video ${i + 1} uploaded successfully!`)
                          setTimeout(() => setUploadMsg(''), 3000)
                        } catch (err: any) {
                          setUploadMsg(`Video ${i + 1} upload failed: ` + (err.message || 'Please try again.'))
                          setTimeout(() => setUploadMsg(''), 5000)
                        }
                        setUploading(null)
                        setVideoProgress(0)
                      }
                    }} />
                    {uploading === `video-${i}` ? (videoProgress > 0 ? `${videoProgress}%` : 'Uploading...') : 'Replace'}
                  </label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, videos: f.videos.filter((_, idx) => idx !== i) }))} title="Remove" className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">&times;</button>
                </div>
              ))}
            </div>
          )}
          {form.videos.length < MAX_VIDEOS && (
            <label className={`flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-lg transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary-400'}`}>
              <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="sr-only" disabled={uploading !== null} onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) {
                  setUploading('video-add')
                  setVideoProgress(0)
                  setUploadMsg('')
                  try {
                    const url = await uploadWithProgress(file, { kind: 'video', onProgress: setVideoProgress })
                    setForm(f => ({ ...f, videos: [...f.videos, { url, name: file.name, size: file.size, mime: file.type || 'video/mp4' }] }))
                    setUploadMsg('Video uploaded successfully!')
                    setTimeout(() => setUploadMsg(''), 3000)
                  } catch (err: any) {
                    setUploadMsg('Video upload failed: ' + (err.message || 'Please try again.'))
                    setTimeout(() => setUploadMsg(''), 5000)
                  }
                  setUploading(null)
                  setVideoProgress(0)
                }
              }} />
              {uploading === 'video-add' ? (
                <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
              )}
              <span className="text-xs text-gray-400">{uploading === 'video-add' ? (videoProgress > 0 ? `Uploading... ${videoProgress}%` : 'Uploading...') : 'Upload Video'}</span>
            </label>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Documents (PDF)</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.documents.length >= MAX_ORDER_DOCUMENTS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
              {form.documents.length} / {MAX_ORDER_DOCUMENTS}
            </span>
          </div>
          <p className="text-xs text-gray-400 -mt-1">Upload catalogues, price lists, brochures, certificates (PDF, max 10MB each).</p>
          {uploadMsg && uploadMsg.startsWith('Document') && <p className={`text-xs ${uploadMsg.includes('fail') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          {form.documents.length > 0 && (
            <div className="space-y-2">
              {form.documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">PDF</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-gray-400">{(doc.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <label className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${uploading === `doc-${i}` ? 'bg-primary-100 text-primary-700' : `cursor-pointer bg-white border border-gray-200 text-gray-600 hover:border-primary-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}`}>
                    <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={uploading !== null} onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (file) {
                        setUploading(`doc-${i}`)
                        setDocProgress(0)
                        setUploadMsg('')
                        try {
                          const url = await uploadWithProgress(file, { kind: 'document', onProgress: setDocProgress })
                          setForm(f => ({ ...f, documents: f.documents.map((d, idx) => idx === i ? { ...d, url, name: file.name, size: file.size } : d) }))
                          setUploadMsg(`Document ${i + 1} uploaded successfully!`)
                          setTimeout(() => setUploadMsg(''), 3000)
                        } catch (err: any) {
                          setUploadMsg(`Document ${i + 1} upload failed: ` + (err.message || 'Please try again.'))
                          setTimeout(() => setUploadMsg(''), 5000)
                        }
                        setUploading(null)
                        setDocProgress(0)
                      }
                    }} />
                    {uploading === `doc-${i}` ? (docProgress > 0 ? `${docProgress}%` : 'Uploading...') : 'Replace'}
                  </label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, documents: f.documents.filter((_, idx) => idx !== i) }))} title="Remove" className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">&times;</button>
                </div>
              ))}
            </div>
          )}
          {form.documents.length < MAX_ORDER_DOCUMENTS && (
            <label className={`flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-lg transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary-400'}`}>
              <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={uploading !== null} onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) {
                  setUploading('doc-add')
                  setDocProgress(0)
                  setUploadMsg('')
                  try {
                    const url = await uploadWithProgress(file, { kind: 'document', onProgress: setDocProgress })
                    setForm(f => ({ ...f, documents: [...f.documents, { url, name: file.name, size: file.size }] }))
                    setUploadMsg('Document uploaded successfully!')
                    setTimeout(() => setUploadMsg(''), 3000)
                  } catch (err: any) {
                    setUploadMsg('Document upload failed: ' + (err.message || 'Please try again.'))
                    setTimeout(() => setUploadMsg(''), 5000)
                  }
                  setUploading(null)
                  setDocProgress(0)
                }
              }} />
              {uploading === 'doc-add' ? (
                <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5A1.125 1.125 0 0113.5 7.125v-4.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              )}
              <span className="text-xs text-gray-400">{uploading === 'doc-add' ? (docProgress > 0 ? `Uploading... ${docProgress}%` : 'Uploading...') : 'Upload PDF'}</span>
            </label>
          )}
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