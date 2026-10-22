"use client"
import { useEffect, useState, useCallback, useRef } from 'react'
import { uploadFile, validateImageFile } from '@/lib/upload-client'
import { formatFileSize, MAX_IMAGE_BYTES, MAX_USER_PHOTOS, parsePhotoUrlList } from '@/lib/profile-media'
import ImageCropper from '@/components/ImageCropper'

interface PhotoItem {
  id: string
  url: string
  uploading?: boolean
  progress?: number
  error?: string
  retryCount?: number
  isNew?: boolean
  _file?: File
}

function newPhotoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [readableCardId, setReadableCardId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropTarget, setCropTarget] = useState<'logo' | 'photo' | 'qr' | null>(null)
  const [cropPhotoId, setCropPhotoId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [pendingUploads, setPendingUploads] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<PhotoItem[]>([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const c = d.data
          setReadableCardId(c.card?.cardId || '')
          const photosData = parsePhotoUrlList(c.photos)
          let socialLinks: any = {}
          try { socialLinks = JSON.parse(c.socialLinks || '{}') } catch { socialLinks = {} }
          setProfile({
            name: c.name || '', designation: c.designation || '', company: c.company || '',
            college: c.college || '',
            mobile: c.mobile || '', whatsapp: c.whatsapp || '', email: c.email || '',
            website: c.website || '', logoUrl: c.logoUrl || '', paymentQrUrl: c.paymentQrUrl || '',
            description: c.description || '', address: c.address || '',
            taluk: c.taluk || '',
            city: c.city || '', state: c.state || '', pincode: c.pincode || '',
            socialLinks,
          })
          setPhotos(photosData.map(url => ({ id: newPhotoId(), url, isNew: false })))
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
    setPhotos(prev => [...prev, { id: newPhotoId(), url, isNew: true }])
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      const target = prev[index]
      if (target?.url.startsWith('blob:')) URL.revokeObjectURL(target.url)
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  function replacePhoto(id: string, url: string) {
    setPhotos(prev => prev.map(photo => {
      if (photo.id !== id) return photo
      if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url)
      return { ...photo, url, isNew: true, error: undefined }
    }))
  }

  function updatePhoto(id: string, patch: Partial<PhotoItem>) {
    setPhotos(prev => prev.map(photo => (photo.id === id ? { ...photo, ...patch } : photo)))
  }

  function setPhotoError(id: string, error: string) {
    updatePhoto(id, { error, uploading: false, progress: undefined })
  }

  function setPhotoProgress(id: string, progress: number) {
    updatePhoto(id, { progress, uploading: true })
  }

  function clearPhotoError(id: string) {
    updatePhoto(id, { error: undefined })
  }

  function incrementRetryCount(id: string) {
    setPhotos(prev => prev.map(photo => (
      photo.id === id ? { ...photo, retryCount: (photo.retryCount || 0) + 1 } : photo
    )))
  }

  async function handlePhotoFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const currentCount = photos.length
    const remaining = MAX_USER_PHOTOS - currentCount
    if (remaining <= 0) {
      setMsg(`Maximum ${MAX_USER_PHOTOS} photos allowed. Remove one to add another.`)
      setTimeout(() => setMsg(''), 5000)
      return
    }
    const files = Array.from(fileList).slice(0, remaining)
    if (fileList.length > remaining) {
      setMsg(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} allowed (max ${MAX_USER_PHOTOS}).`)
      setTimeout(() => setMsg(''), 5000)
    }

    // Validate files first
    const validFiles: File[] = []
    for (const file of files) {
      const validationError = validateImageFile(file)
      if (validationError) {
        setMsg(`${file.name}: ${validationError}`)
        setTimeout(() => setMsg(''), 5000)
      } else {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0) return

    // Add placeholder entries for immediate preview
    const placeholders: PhotoItem[] = validFiles.map(file => ({
      id: newPhotoId(),
      url: URL.createObjectURL(file),
      uploading: true,
      progress: 0,
      isNew: true,
      _file: file // Store file reference for upload
    }))

    setPhotos(prev => [...prev, ...placeholders])
    setPendingUploads(prev => prev + validFiles.length)

    // Upload sequentially. Every update is keyed by a stable photo id so
    // concurrent removals or reordering cannot redirect progress to another tile.
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const placeholder = placeholders[i]
      try {
        const url = await uploadFile(file, {
          onProgress: (p) => setPhotoProgress(placeholder.id, p)
        })
        if (placeholder.url.startsWith('blob:')) URL.revokeObjectURL(placeholder.url)
        updatePhoto(placeholder.id, { url, uploading: false, progress: undefined, _file: undefined })
      } catch (err: any) {
        setPhotoError(placeholder.id, err.message || 'Upload failed. Tap to retry.')
      } finally {
        setPendingUploads(prev => prev - 1)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function retryUpload(id: string) {
    const photo = photosRef.current.find(item => item.id === id)
    const file = photo?._file
    if (!file) return

    clearPhotoError(id)
    incrementRetryCount(id)
    setPendingUploads(prev => prev + 1)

    try {
      const url = await uploadFile(file, {
        onProgress: (p) => setPhotoProgress(id, p)
      })
      if (photo?.url.startsWith('blob:')) URL.revokeObjectURL(photo.url)
      updatePhoto(id, { url, uploading: false, progress: undefined, _file: undefined, error: undefined })
    } catch (err: any) {
      setPhotoError(id, err.message || 'Upload failed. Tap to retry.')
    } finally {
      setPendingUploads(prev => prev - 1)
    }
  }

  function handleCropComplete(croppedFile: File) {
    if (cropTarget === 'logo') {
      uploadCroppedFile(croppedFile, 'logo', (url) => updateField('logoUrl', url))
    } else if (cropTarget === 'photo') {
      if (cropPhotoId !== null) {
        const id = cropPhotoId
        uploadCroppedFile(croppedFile, `photo-${id}`, (url) => replacePhoto(id, url))
      } else {
        uploadCroppedFile(croppedFile, 'photo-add', (url) => addPhoto(url))
      }
    }
    setCropFile(null)
    setCropTarget(null)
    setCropPhotoId(null)
  }

  function handleCropCancel() {
    setCropFile(null)
    setCropTarget(null)
    setCropPhotoId(null)
  }

  async function uploadCroppedFile(file: File, key: string, onSuccess: (url: string) => void) {
    setPendingUploads(prev => prev + 1)
    try {
      const url = await uploadFile(file)
      onSuccess(url)
    } catch (err: any) {
      setMsg('Upload failed: ' + (err.message || 'Please try again.'))
      setTimeout(() => setMsg(''), 5000)
    } finally {
      setPendingUploads(prev => prev - 1)
    }
  }

  async function handleSave() {
    if (pendingUploads > 0) {
      setMsg('Please wait for uploads to complete before saving.')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    // Validate photos - only include successfully uploaded ones
    const validPhotos = photos.filter(p => p.url && !p.uploading && !p.error)
    if (validPhotos.length > MAX_USER_PHOTOS) {
      setMsg(`Maximum ${MAX_USER_PHOTOS} photos allowed.`)
      setTimeout(() => setMsg(''), 5000)
      return
    }

    setSaving(true)
    setMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/customer/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...profile, photos: validPhotos.map(p => p.url) }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg('Profile updated successfully!')
        // Update photos state to remove isNew flag
        setPhotos(validPhotos.map(p => ({ ...p, isNew: false })))
      } else {
        setMsg(data.error || 'Failed to update')
      }
    } catch {
      setMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach(p => {
        if (p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url)
        }
      })
    }
  }, [])

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-2xl">
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>
  )

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
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${cropTarget === 'logo' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                const err = validateImageFile(file)
                if (err) {
                  setMsg(err)
                  setTimeout(() => setMsg(''), 5000)
                  return
                }
                setCropFile(file)
                setCropTarget('logo')
              }
            }} />
            {cropTarget === 'logo' ? (
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              </div>
            ) : profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{cropTarget === 'logo' ? 'Preparing...' : profile.logoUrl ? 'Change photo' : "Upload your profile picture"}</span>
          </label>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Payment QR Code (UPI)</h2>
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${cropTarget === 'qr' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                const err = validateImageFile(file)
                if (err) {
                  setMsg(err)
                  setTimeout(() => setMsg(''), 5000)
                  return
                }
                setCropFile(file)
                setCropTarget('qr')
              }
            }} />
            {cropTarget === 'qr' ? (
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              </div>
            ) : profile.paymentQrUrl ? (
              <img src={profile.paymentQrUrl} alt="Payment QR" className="w-12 h-12 rounded-lg object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
              </div>
            )}
            <span className="text-sm text-gray-500">{cropTarget === 'qr' ? 'Preparing...' : profile.paymentQrUrl ? 'Change payment QR' : 'Upload UPI payment QR code'}</span>
          </label>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-lg">Photos</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${photos.length >= MAX_USER_PHOTOS ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
              {photos.length} / {MAX_USER_PHOTOS}
            </span>
          </div>
          <p className="text-xs text-gray-400 -mt-1">Up to {MAX_USER_PHOTOS} photos (JPG, PNG, WebP, GIF, BMP, HEIC, HEIF, AVIF or TIFF, max {formatFileSize(MAX_IMAGE_BYTES)} each). Photos appear on your public NFC profile in this order.</p>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, idx) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  index={idx}
                  totalPhotos={photos.length}
                  onRemove={() => removePhoto(idx)}
                  onMoveUp={() => movePhoto(idx, -1)}
                  onMoveDown={() => movePhoto(idx, 1)}
                  onReplace={() => {
                    // Fetch the image file from the URL for cropping
                    fetch(photo.url)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], `photo-${idx}.jpg`, { type: 'image/jpeg' })
                        setCropFile(file)
                        setCropTarget('photo')
                        setCropPhotoId(photo.id)
                      })
                      .catch(() => {
                        setMsg('Failed to load image for editing. Please re-upload.')
                        setTimeout(() => setMsg(''), 5000)
                      })
                  }}
                  onRetry={() => retryUpload(photo.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No photos yet. Your profile picture and any photos you add will show here.</p>
          )}

          {photos.length < MAX_USER_PHOTOS && (
            <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${pendingUploads > 0 ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,image/heic,image/heif,image/tiff"
                multiple
                className="sr-only"
                onChange={(e) => {
                  handlePhotoFiles(e.target.files)
                  if (e.target) e.target.value = ''
                }}
                disabled={pendingUploads > 0}
              />
              {pendingUploads > 0 ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-primary-600 mb-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <span className="text-xs text-gray-400">Uploading {pendingUploads} photo{pendingUploads > 1 ? 's' : ''}...</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span className="text-xs text-gray-400">Add Photo{photos.length < MAX_USER_PHOTOS - 1 ? 's' : ''}</span>
                </>
              )}
            </label>
          )}
        </div>

        <button onClick={handleSave} disabled={saving || pendingUploads > 0} className="btn-primary w-full">
          {saving ? 'Saving...' : pendingUploads > 0 ? `Uploading ${pendingUploads} photo${pendingUploads > 1 ? 's' : ''}...` : 'Save Profile'}
        </button>
      </div>

      {cropFile && cropTarget && (
        <ImageCropper
          file={cropFile}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  )
}

function PhotoCard({ photo, index, totalPhotos, onRemove, onMoveUp, onMoveDown, onReplace, onRetry }: {
  photo: PhotoItem
  index: number
  totalPhotos: number
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onReplace: () => void
  onRetry: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [photo.url])

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setImageLoaded(true)
  }, [photo.url])

  const handleImageError = useCallback(() => {
    setImageError(true)
    setImageLoaded(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  const isUploading = photo.uploading === true
  const hasError = photo.error !== undefined

  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
        {!imageLoaded && !imageError && !isUploading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
            <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden mb-2" style={{ width: '80%' }}>
              <div className="h-full bg-primary-500 transition-all duration-200" style={{ width: `${photo.progress ?? 0}%` }} />
            </div>
            <span className="text-xs font-medium">Uploading... {photo.progress ?? 0}%</span>
          </div>
        )}
        {!isUploading && hasError && (
          <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center text-white z-10 p-4">
            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium text-center mb-2">Upload Failed</p>
            <p className="text-xs text-center text-red-100 mb-3">{photo.error}</p>
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {imageError && !isUploading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
            <span className="text-xs">Preview unavailable</span>
          </div>
        )}
        <img
          ref={imgRef}
          src={photo.url}
          alt={`Photo ${index + 1}`}
          decoding="async"
          className={`w-full h-32 object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{index + 1}</span>
        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move earlier"
            className="w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center disabled:opacity-30 hover:bg-black/80"
          >&#8593;</button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalPhotos - 1}
            title="Move later"
            className="w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center disabled:opacity-30 hover:bg-black/80"
          >&#8595;</button>
          <button
            type="button"
            onClick={onReplace}
            title="Replace & crop"
            className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-700"
            disabled={isUploading || hasError}
          >&#9998;</button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remove photo"
          className="absolute bottom-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
          disabled={isUploading}
        >&times;</button>
      </div>
      {photo.isNew && !isUploading && !hasError && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">
          New
        </div>
      )}
    </div>
  )
}