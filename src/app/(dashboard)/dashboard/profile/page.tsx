"use client"
import { useEffect, useState } from 'react'
import { uploadFile } from '@/lib/upload-client'
import { MAX_USER_PHOTOS } from '@/lib/profile-media'

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [readableCardId, setReadableCardId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const c = d.data
          setReadableCardId(c.card?.cardId || '')
          let photos: string[] = []
          try { photos = JSON.parse(c.photos || '[]') } catch { photos = [] }
          setProfile({
            name: c.name || '', designation: c.designation || '', company: c.company || '',
            college: c.college || '',
            mobile: c.mobile || '', whatsapp: c.whatsapp || '', email: c.email || '',
            website: c.website || '', logoUrl: c.logoUrl || '', paymentQrUrl: c.paymentQrUrl || '',
            description: c.description || '', address: c.address || '',
            taluk: c.taluk || '',
            city: c.city || '', state: c.state || '', pincode: c.pincode || '',
            photos,
            socialLinks: JSON.parse(c.socialLinks || '{}'),
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function updateField(field: string, value: string) {
    setProfile((p: any) => ({ ...p, [field]: value }))
  }

  function updateSocial(platform: string, value: string) {
    setProfile((p: any) => ({ ...p, socialLinks: { ...p.socialLinks, [platform]: value } }))
  }

  function addPhoto(url: string) {
    setProfile((p: any) => ({ ...p, photos: [...(p.photos || []), url] }))
  }

  function removePhoto(index: number) {
    setProfile((p: any) => {
      const photos = [...(p.photos || [])]
      photos.splice(index, 1)
      return { ...p, photos }
    })
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setProfile((p: any) => {
      const photos = [...(p.photos || [])]
      const target = index + direction
      if (target < 0 || target >= photos.length) return p
      const tmp = photos[index]
      photos[index] = photos[target]
      photos[target] = tmp
      return { ...p, photos }
    })
  }

  async function handlePhotoFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const current: string[] = profile?.photos || []
    const remaining = MAX_USER_PHOTOS - current.length
    if (remaining <= 0) {
      setUploadMsg(`Photo upload failed: Maximum ${MAX_USER_PHOTOS} photos allowed. Remove one to add another.`)
      setTimeout(() => setUploadMsg(''), 5000)
      return
    }
    const files = Array.from(fileList).slice(0, remaining)
    if (fileList.length > remaining) {
      setUploadMsg(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} allowed (max ${MAX_USER_PHOTOS}).`)
      setTimeout(() => setUploadMsg(''), 5000)
    }
    for (let i = 0; i < files.length; i++) {
      setUploading('photo')
      setUploadPercent(0)
      try {
        const url = await uploadFile(files[i], { onProgress: setUploadPercent })
        addPhoto(url)
        setUploadMsg(`Photo uploaded (${(profile?.photos?.length || 0) + i + 1}/${MAX_USER_PHOTOS})`)
        setTimeout(() => setUploadMsg(''), 3000)
      } catch (err: any) {
        setUploadMsg('Photo upload failed: ' + (err.message || 'Please try again.'))
        setTimeout(() => setUploadMsg(''), 5000)
        break
      }
    }
    setUploadPercent(null)
    setUploading(null)
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/customer/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (data.success) setMsg('Profile updated successfully!')
      else setMsg(data.error || 'Failed to update')
    } catch {
      setMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-48"></div>
    <div className="h-96 bg-gray-200 rounded-xl"></div>
  </div>

  if (!profile) return <div className="text-center py-12 text-gray-500">Could not load profile.</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <p className="text-gray-600 text-sm mb-6">Changes save instantly to your digital profile at <span className="font-mono text-primary-600">/p/{readableCardId}</span></p>

      {msg && <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

      <div className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Basic Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input-field" value={profile.name} onChange={e => updateField('name', e.target.value)} /></div>
            <div><label className="label">Designation</label><input className="input-field" value={profile.designation} onChange={e => updateField('designation', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input-field" value={profile.company} onChange={e => updateField('company', e.target.value)} /></div>
            <div><label className="label">University / College</label><input className="input-field" value={profile.college} onChange={e => updateField('college', e.target.value)} /></div>
          </div>
          <div><label className="label">About / Description</label><textarea className="input-field" rows={3} value={profile.description} onChange={e => updateField('description', e.target.value)} /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Mobile</label><input className="input-field" value={profile.mobile} onChange={e => updateField('mobile', e.target.value)} /></div>
            <div><label className="label">WhatsApp</label><input className="input-field" value={profile.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input-field" type="email" value={profile.email} onChange={e => updateField('email', e.target.value)} /></div>
            <div><label className="label">Website</label><input className="input-field" value={profile.website} onChange={e => updateField('website', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Address</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Address</label><input className="input-field" value={profile.address} onChange={e => updateField('address', e.target.value)} /></div>
            <div><label className="label">Taluk</label><input className="input-field" value={profile.taluk} onChange={e => updateField('taluk', e.target.value)} /></div>
            <div><label className="label">City</label><input className="input-field" value={profile.city} onChange={e => updateField('city', e.target.value)} /></div>
            <div><label className="label">State</label><input className="input-field" value={profile.state} onChange={e => updateField('state', e.target.value)} /></div>
            <div><label className="label">PIN Code</label><input className="input-field" value={profile.pincode} onChange={e => updateField('pincode', e.target.value)} /></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Social Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: 'instagram', label: 'Instagram', placeholder: 'username' },
              { id: 'facebook', label: 'Facebook', placeholder: 'username' },
              { id: 'linkedin', label: 'LinkedIn', placeholder: 'username' },
              { id: 'twitter', label: 'Twitter / X', placeholder: 'username' },
              { id: 'youtube', label: 'YouTube', placeholder: 'channelname' },
            ].map(p => (
              <div key={p.id}><label className="label">{p.label}</label><input className="input-field" placeholder={p.placeholder} value={profile.socialLinks[p.id] || ''} onChange={e => updateSocial(p.id, e.target.value)} /></div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Logo / Profile Picture</h2>
          {uploadMsg && uploadMsg.startsWith('Logo') && <p className={`text-xs ${uploadMsg.includes('failed') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading === 'logo' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                setUploading('logo')
                setUploadMsg('')
                try {
                  const url = await uploadFile(file)
                  updateField('logoUrl', url)
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
            ) : profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{uploading === 'logo' ? 'Uploading...' : profile.logoUrl ? 'Change logo' : "If you don't have a logo, upload a profile picture"}</span>
          </label>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Payment QR Code (UPI)</h2>
          {uploadMsg && uploadMsg.startsWith('QR') && <p className={`text-xs ${uploadMsg.includes('failed') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading === 'qr' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                setUploading('qr')
                setUploadMsg('')
                try {
                  const url = await uploadFile(file)
                  updateField('paymentQrUrl', url)
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
            ) : profile.paymentQrUrl ? (
              <img src={profile.paymentQrUrl} alt="Payment QR" className="w-12 h-12 rounded-lg object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{uploading === 'qr' ? 'Uploading...' : profile.paymentQrUrl ? 'Change payment QR' : 'Upload UPI payment QR code'}</span>
          </label>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-lg">Photos</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${(profile.photos || []).length >= MAX_USER_PHOTOS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
              {(profile.photos || []).length} / {MAX_USER_PHOTOS}
            </span>
          </div>
          <p className="text-xs text-gray-400 -mt-1">Up to {MAX_USER_PHOTOS} photos (JPG, JPEG, PNG or WebP, max 20MB each). Photos appear on your public NFC profile in this order.</p>
          {uploadMsg && uploadMsg.startsWith('Photo') && <p className={`text-xs ${uploadMsg.includes('failed') || uploadMsg.includes('Maximum') || uploadMsg.includes('allowed') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}

          {uploading === 'photo' && (
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-200"
                  style={{ width: `${uploadPercent ?? 0}%` }}
                />
              </div>
              <p className="text-[11px] text-primary-600">Uploading photo... {uploadPercent ?? 0}%</p>
            </div>
          )}

          {(profile.photos || []).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(profile.photos || []).map((photo: string, idx: number) => (
                <div key={idx} className="relative group">
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-32 rounded-lg object-cover bg-gray-100" />
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{idx + 1}</span>
                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => movePhoto(idx, -1)}
                      disabled={idx === 0}
                      title="Move earlier"
                      className="w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center disabled:opacity-30 hover:bg-black/80"
                    >&#8593;</button>
                    <button
                      type="button"
                      onClick={() => movePhoto(idx, 1)}
                      disabled={idx === (profile.photos || []).length - 1}
                      title="Move later"
                      className="w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center disabled:opacity-30 hover:bg-black/80"
                    >&#8595;</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    title="Remove photo"
                    className="absolute bottom-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  >&times;</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No photos yet. Your profile picture and any photos you add will show here.</p>
          )}

          {(profile.photos || []).length < MAX_USER_PHOTOS && (
            <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading === 'photo' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  handlePhotoFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              {uploading === 'photo' ? (
                <svg className="animate-spin h-8 w-8 text-primary-600 mb-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              )}
              <span className="text-xs text-gray-400">
                {uploading === 'photo' ? 'Uploading...' : `Add Photo${(profile.photos || []).length < MAX_USER_PHOTOS - 1 ? 's' : ''}`}
              </span>
            </label>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
