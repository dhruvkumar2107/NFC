"use client"
import { useEffect, useState } from 'react'

async function uploadFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Max size is 5MB.')
  }
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Upload failed')
  return data.url
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [readableCardId, setReadableCardId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState('')

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
            website: c.website || '', logoUrl: c.logoUrl || '',
            description: c.description || '', address: c.address || '',
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

  function updatePhoto(index: number, value: string) {
    setProfile((p: any) => {
      const photos = [...(p.photos || [])]
      photos[index] = value
      return { ...p, photos }
    })
  }

  function removePhoto(index: number) {
    setProfile((p: any) => {
      const photos = [...(p.photos || [])]
      photos.splice(index, 1)
      return { ...p, photos }
    })
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
          <h2 className="font-semibold text-lg">Logo</h2>
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
            <span className="text-sm text-gray-500">{uploading === 'logo' ? 'Uploading...' : profile.logoUrl ? 'Change logo' : 'Upload logo'}</span>
          </label>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Photos</h2>
          {uploadMsg && uploadMsg.startsWith('Photo') && <p className={`text-xs ${uploadMsg.includes('failed') || uploadMsg.includes('too large') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(profile.photos || []).map((photo: string, idx: number) => (
              <div key={idx} className="relative group">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-32 rounded-lg object-cover" />
                <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">&times;</button>
              </div>
            ))}
            {(profile.photos || []).length < 4 && (
              <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading === 'photo' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploading('photo')
                    setUploadMsg('')
                    try {
                      const url = await uploadFile(file)
                      updatePhoto(profile.photos?.length || 0, url)
                      setUploadMsg(`Photo ${(profile.photos?.length || 0) + 1} uploaded successfully!`)
                      setTimeout(() => setUploadMsg(''), 3000)
                    } catch (err: any) {
                      setUploadMsg('Photo upload failed: ' + (err.message || 'Please try again.'))
                      setTimeout(() => setUploadMsg(''), 5000)
                    }
                    setUploading(null)
                  }
                }} />
                {uploading === 'photo' ? (
                  <svg className="animate-spin h-8 w-8 text-primary-600 mb-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                )}
                <span className="text-xs text-gray-400">{uploading === 'photo' ? 'Uploading...' : 'Add Photo'}</span>
              </label>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
