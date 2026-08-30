"use client"
import { useEffect, useState } from 'react'

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [readableCardId, setReadableCardId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const c = d.data
          setReadableCardId(c.card?.cardId || '')
          setProfile({
            name: c.name || '', designation: c.designation || '', company: c.company || '',
            mobile: c.mobile || '', whatsapp: c.whatsapp || '', email: c.email || '',
            website: c.website || '', location: c.location || '', upiId: c.upiId || '',
            profilePhotoUrl: c.profilePhotoUrl || '', logoUrl: c.logoUrl || '',
            description: c.description || '',
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
            <div><label className="label">Location</label><input className="input-field" value={profile.location} onChange={e => updateField('location', e.target.value)} /></div>
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
          <h2 className="font-semibold text-lg">Social Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'].map(p => (
              <div key={p}><label className="label capitalize">{p}</label><input className="input-field" placeholder={`https://${p}.com/...`} value={profile.socialLinks[p] || ''} onChange={e => updateSocial(p, e.target.value)} /></div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Payment & Media</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">UPI ID</label><input className="input-field" placeholder="yourname@upi" value={profile.upiId} onChange={e => updateField('upiId', e.target.value)} /></div>
            <div><label className="label">Profile Photo URL</label><input className="input-field" value={profile.profilePhotoUrl} onChange={e => updateField('profilePhotoUrl', e.target.value)} /></div>
            <div><label className="label">Logo URL</label><input className="input-field" value={profile.logoUrl} onChange={e => updateField('logoUrl', e.target.value)} /></div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
