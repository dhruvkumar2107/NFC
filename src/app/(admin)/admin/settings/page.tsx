"use client"
import { useState, useEffect } from 'react'

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [paymentQrUrl, setPaymentQrUrl] = useState('')
  const [qrSaving, setQrSaving] = useState(false)
  const [qrUploading, setQrUploading] = useState(false)
  const [qrMsg, setQrMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAdmin(d.data)
          setPaymentQrUrl(d.data.paymentQrUrl || '')
        }
      })
      .catch(() => {})
  }, [])

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { setMsg('Passwords do not match'); return }
    if (pwForm.newPassword.length < 6) { setMsg('Password must be at least 6 characters'); return }
    setSaving(true); setMsg('')
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const d = await res.json()
    if (d.success) { setMsg('Password changed successfully!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
    else setMsg(d.error || 'Failed')
    setSaving(false)
  }

  async function onQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setQrUploading(true); setQrMsg('')
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const d = await res.json()
    if (d.success && d.data) setPaymentQrUrl(d.data)
    else setQrMsg(d.error || 'Upload failed')
    setQrUploading(false)
  }

  async function savePaymentQr() {
    setQrSaving(true); setQrMsg('')
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentQrUrl }),
    })
    const d = await res.json()
    if (d.success) { setQrMsg('Payment QR code URL saved!') }
    else setQrMsg(d.error || 'Failed to save')
    setQrSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-4">Account Info</h2>
        <div className="space-y-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{admin?.name || 'System Admin'}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{admin?.email || 'admin@mysmartcard.net'}</span></div>
          <div><span className="text-gray-500">Role:</span> <span className="font-medium">Super Admin</span></div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-4">Payment QR Code</h2>
        <p className="text-sm text-gray-500 mb-4">Upload the payment QR code image (from your gallery) that customers see on their profile for receiving payments.</p>
        {qrMsg && <div className={`p-3 rounded-lg mb-4 text-sm ${qrMsg.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{qrMsg}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Payment QR Code Image</label>
            <label className="mt-1 flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#1677ff] transition-colors bg-gray-50 overflow-hidden">
              {!paymentQrUrl && <span className="text-sm text-gray-500">Upload from gallery</span>}
              {paymentQrUrl && <img src={paymentQrUrl} alt="Payment QR Preview" className="w-full h-full object-contain" />}
              <input type="file" accept="image/*" className="hidden" onChange={onQrUpload} />
            </label>
          </div>
          {qrUploading && <div className="text-sm text-gray-500">Uploading...</div>}
          <button onClick={savePaymentQr} disabled={qrSaving} className="btn-primary">{qrSaving ? 'Saving...' : 'Save QR Code'}</button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Change Password</h2>
        {msg && <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
        <form onSubmit={changePassword} className="space-y-4">
          <div><label className="label">Current Password</label><input type="password" className="input-field" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
          <div><label className="label">New Password</label><input type="password" className="input-field" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} /></div>
          <div><label className="label">Confirm New Password</label><input type="password" className="input-field" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  )
}
