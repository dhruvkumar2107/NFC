"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { uploadFile } from '@/lib/upload-client'
import { FONT_CLASS, SECTION_REGISTRY, normalizeSections, normalizeTheme, type CardSections, type CardTheme, type CustomSection } from '@/lib/builder'
import { formatFileSize, MAX_VIDEOS, MAX_VIDEO_BYTES, MAX_ALBUM_MEDIA } from '@/lib/profile-media'
import { formatInr } from '@/lib/emi'
import { parseAttributes } from '@/lib/product-utils'

interface Props {
  cardId: string
  previewBase?: string
}

async function jfetch(url: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`)
  return data.data
}

const TABS = [
  { key: 'theme', label: 'Theme' },
  { key: 'sections', label: 'Sections' },
  { key: 'media', label: 'Gallery' },
  { key: 'products', label: 'Products' },
  { key: 'catalogues', label: 'Catalogues' },
  { key: 'emi', label: 'EMI' },
  { key: 'settings', label: 'Settings' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function CardBuilderEditor({ cardId, previewBase }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<TabKey>('theme')
  const [saving, setSaving] = useState(false)

  const [config, setConfig] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])

  const [theme, setTheme] = useState<CardTheme>(normalizeTheme(null))
  const [sections, setSections] = useState<CardSections>(normalizeSections(null))
  const [industry, setIndustry] = useState('general')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState('draft')
  const [emiEnabled, setEmiEnabled] = useState(false)
  const [emiConfig, setEmiConfig] = useState<any>({ defaultRate: 10, minTenure: 3, maxTenure: 60, defaultTenure: 12, processingFee: 0 })
  const [templateId, setTemplateId] = useState<string>('')
  const [coverImage, setCoverImage] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await jfetch(`/api/admin/cards/${cardId}/builder`)
      const c = data.config
      setConfig(c)
      setCustomer(data.customer)
      setIsAdmin(!!data.permissions?.isAdmin)
      setTheme(normalizeTheme(c.theme))
      setSections(normalizeSections(c.sections))
      setIndustry(c.industry || 'general')
      setSlug(c.slug || '')
      setStatus(c.status || 'draft')
      setEmiEnabled(!!c.emiEnabled)
      setTemplateId(c.templateId || '')
      setCoverImage(c.coverImage || '')
      setLogoUrl(c.logoUrl || '')
      setProfileImage(c.profileImage || '')
      if (c.emiConfig) setEmiConfig({
        defaultRate: c.emiConfig.defaultRate,
        minTenure: c.emiConfig.minTenure,
        maxTenure: c.emiConfig.maxTenure,
        defaultTenure: c.emiConfig.defaultTenure,
        processingFee: c.emiConfig.processingFee,
      })
      // Templates are admin-only; silently ignore 403 for customer logins
      try {
        const tpl = await jfetch('/api/admin/templates')
        setTemplates(tpl.templates || [])
      } catch {
        setTemplates([])
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [cardId])

  useEffect(() => { load() }, [load])

  async function save(overrides: Record<string, any> = {}, publishStatus?: string) {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const body: any = {
        theme,
        sections,
        industry,
        slug,
        status: publishStatus || status,
        // EMI is admin-controlled; the API ignores these fields for customers.
        ...(isAdmin ? { emiEnabled, emiConfig } : {}),
        templateId: templateId || null,
        coverImage: coverImage || null,
        logoUrl: logoUrl || null,
        profileImage: profileImage || null,
        ...overrides,
      }
      const data = await jfetch(`/api/admin/cards/${cardId}/builder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setConfig(data.config)
      setEmiEnabled(!!data.config.emiEnabled)
      if (publishStatus) setStatus(publishStatus)
      else setStatus(data.config.status)
      setMsg('Saved successfully.')
      setTimeout(() => setMsg(''), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function applyTemplate(id: string) {
    setTemplateId(id)
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    let parsed: any = {}
    try { parsed = JSON.parse(tpl.config || '{}') } catch { parsed = {} }
    setTheme(normalizeTheme(parsed.theme))
    setSections(normalizeSections(parsed.sections))
    setIndustry(tpl.industry)
    setMsg(`Template "${tpl.name}" loaded. Review the sections, then Save.`)
  }

  const previewUrl = useMemo(() => {
    if (!customer) return ''
    const base = previewBase || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/p/${config?.card?.cardId || ''}`
  }, [customer, config, previewBase])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-gray-200" /><div className="h-96 rounded-2xl bg-gray-100" /></div>
  if (error && !config) return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Custom Card Builder</h1>
          <p className="text-sm text-gray-500">{customer?.name || 'Card'} · <span className="font-mono">{config?.card?.cardId}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === 'published' ? 'bg-green-100 text-green-700' : status === 'unpublished' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{status}</span>
          <button onClick={() => save()} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save draft'}</button>
          {status !== 'published'
            ? <button onClick={() => save({}, 'published')} disabled={saving} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Publish</button>
            : <button onClick={() => save({}, 'unpublished')} disabled={saving} className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">Unpublish</button>}
          {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Preview</a>}
        </div>
      </div>

      {msg && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex flex-wrap gap-1 border-b border-gray-100 p-2">
            {TABS.filter((t) => t.key !== 'emi' || isAdmin).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}>{t.label}</button>
            ))}
          </div>
          <div className="p-4">
            {tab === 'theme' && <ThemePanel theme={theme} setTheme={setTheme} customer={customer} config={config} onSave={save} coverImage={coverImage} setCoverImage={setCoverImage} logoUrl={logoUrl} setLogoUrl={setLogoUrl} profileImage={profileImage} setProfileImage={setProfileImage} />}
            {tab === 'sections' && <SectionsPanel sections={sections} setSections={setSections} emiEnabled={!!config?.emiEnabled} />}
            {tab === 'media' && <MediaPanel cardId={cardId} config={config} reload={load} />}
            {tab === 'products' && <ProductsPanel cardId={cardId} config={config} reload={load} />}
            {tab === 'catalogues' && <CataloguesPanel config={config} reload={load} />}
            {tab === 'emi' && isAdmin && <EmiPanel enabled={emiEnabled} setEnabled={setEmiEnabled} value={emiConfig} setValue={setEmiConfig} saved={!!config?.emiEnabled} saving={saving} onSave={() => save()} />}
            {tab === 'settings' && <SettingsPanel templates={templates} templateId={templateId} applyTemplate={applyTemplate} industry={industry} setIndustry={setIndustry} slug={slug} setSlug={setSlug} />}
          </div>
        </div>

        <CardPreview theme={theme} sections={sections} customer={customer} config={config} />
      </div>
    </div>
  )
}

/* ------------------------------- Theme ------------------------------- */
function ThemePanel({ theme, setTheme, customer, config, onSave, coverImage, setCoverImage, logoUrl, setLogoUrl, profileImage, setProfileImage }: any) {
  const [uploading, setUploading] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, target: 'profileImage' | 'coverImage' | 'logoUrl') {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(target)
    try {
      const url = await uploadFile(file, { kind: 'image' })
      if (target === 'profileImage') setProfileImage(url)
      if (target === 'coverImage') setCoverImage(url)
      if (target === 'logoUrl') setLogoUrl(url)
      await onSave({ [target]: url })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(null)
    }
  }

  const upd = (patch: Partial<CardTheme>) => setTheme({ ...theme, ...patch })
  const shownProfile = profileImage || customer?.logoUrl

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-gray-500">Primary colour
          <input type="color" value={theme.primary} onChange={(e) => upd({ primary: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200" />
        </label>
        <label className="text-xs font-semibold text-gray-500">Secondary colour
          <input type="color" value={theme.secondary} onChange={(e) => upd({ secondary: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200" />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs font-semibold text-gray-500">Header style
          <select value={theme.headerStyle} onChange={(e) => upd({ headerStyle: e.target.value as any })} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm">
            <option value="gradient">Gradient</option><option value="solid">Solid</option><option value="glass">Glass</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">Layout
          <select value={theme.layout} onChange={(e) => upd({ layout: e.target.value as any })} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm">
            <option value="classic">Classic</option><option value="modern">Modern</option><option value="compact">Compact</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">Font
          <select value={theme.font} onChange={(e) => upd({ font: e.target.value as any })} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm">
            <option value="sans">Sans</option><option value="serif">Serif</option><option value="rounded">Rounded</option>
          </select>
        </label>
      </div>
      <div className="rounded-xl bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-500">Profile image</p>
        <div className="flex items-center gap-3">
          {shownProfile && <img src={shownProfile} alt="" className="h-14 w-14 rounded-full object-cover" />}
          <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
            {uploading === 'profileImage' ? 'Uploading...' : 'Upload photo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'profileImage')} disabled={!!uploading} />
          </label>
          {profileImage && (
            <button type="button" onClick={() => { setProfileImage(''); onSave({ profileImage: null }) }} className="text-xs text-gray-400 hover:text-red-500">
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500">Cover image</p>
          <div className="flex items-center gap-3">
            {coverImage && <img src={coverImage} alt="" className="h-12 w-16 rounded-lg object-cover" />}
            <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
              {uploading === 'coverImage' ? 'Uploading...' : coverImage ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'coverImage')} disabled={!!uploading} />
            </label>
            {coverImage && (
              <button type="button" onClick={() => { setCoverImage(''); onSave({ coverImage: null }) }} className="text-xs text-gray-400 hover:text-red-500">
                Remove
              </button>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500">Brand logo</p>
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-white" />}
            <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
              {uploading === 'logoUrl' ? 'Uploading...' : logoUrl ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'logoUrl')} disabled={!!uploading} />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => { setLogoUrl(''); onSave({ logoUrl: null }) }} className="text-xs text-gray-400 hover:text-red-500">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Sections ----------------------------- */
function SectionsPanel({ sections, setSections, emiEnabled }: { sections: CardSections; setSections: (s: CardSections) => void; emiEnabled: boolean }) {
  const toggle = (key: string) => setSections({ ...sections, enabled: { ...sections.enabled, [key]: !sections.enabled[key] } })
  const setTitle = (key: string, v: string) => setSections({ ...sections, titles: { ...sections.titles, [key]: v } })
  const setField = (key: string, v: string) => setSections({ ...sections, fields: { ...sections.fields, [key]: v } })

  const updateCustom = (key: string, patch: Partial<CustomSection>) =>
    setSections({ ...sections, custom: sections.custom.map((c) => (c.key === key ? { ...c, ...patch } : c)) })

  const addCustom = () => {
    const key = `custom-${Date.now().toString(36)}`
    setSections({
      ...sections,
      custom: [...sections.custom, { key, title: 'New section', body: '' }],
      enabled: { ...sections.enabled, [key]: true },
      order: [...sections.order, key],
    })
  }

  const removeCustom = (key: string) => {
    const enabled = { ...sections.enabled }
    delete enabled[key]
    setSections({
      ...sections,
      custom: sections.custom.filter((c) => c.key !== key),
      enabled,
      order: sections.order.filter((k) => k !== key),
    })
  }

  const move = (idx: number, dir: -1 | 1) => {
    const order = [...sections.order]
    const next = idx + dir
    if (next < 0 || next >= order.length) return
    ;[order[idx], order[next]] = [order[next], order[idx]]
    setSections({ ...sections, order })
  }

  const fieldSections = ['about', 'hours', 'team', 'schedule', 'amenities']

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sections.order.map((key, idx) => {
          const meta = SECTION_REGISTRY.find((s) => s.key === key)
          const custom = sections.custom.find((c) => c.key === key)
          if (!meta && !custom) return null
          return (
            <div key={key} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => move(idx, -1)} className="text-gray-400 hover:text-gray-600">↑</button>
                <button type="button" onClick={() => move(idx, 1)} className="text-gray-400 hover:text-gray-600">↓</button>
                {key === 'emi' ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
                    {meta?.label}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${emiEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{emiEnabled ? 'SHOWN' : 'HIDDEN'}</span>
                    <span className="text-[11px] font-normal text-gray-400">Set by admin in the EMI tab</span>
                  </div>
                ) : (
                  <label className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={!!sections.enabled[key]} onChange={() => toggle(key)} className="accent-primary-600" />
                    {meta ? meta.label : custom?.title || 'Custom section'}
                    {!meta && <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">CUSTOM</span>}
                  </label>
                )}
                {meta ? (
                  <input value={sections.titles[key] || ''} onChange={(e) => setTitle(key, e.target.value)} className="w-40 rounded-lg border border-gray-200 px-2 py-1 text-xs" placeholder="Section title" />
                ) : (
                  <input value={custom?.title || ''} onChange={(e) => updateCustom(key, { title: e.target.value })} className="w-40 rounded-lg border border-gray-200 px-2 py-1 text-xs" placeholder="Section title" />
                )}
                {custom && (
                  <button type="button" onClick={() => removeCustom(key)} className="text-xs text-red-500">Remove</button>
                )}
              </div>
              {sections.enabled[key] && meta && fieldSections.includes(key) && (
                <textarea value={sections.fields[key] || ''} onChange={(e) => setField(key, e.target.value)} rows={2}
                  placeholder={meta.description} className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" />
              )}
              {sections.enabled[key] && custom && (
                <textarea value={custom.body || ''} onChange={(e) => updateCustom(key, { body: e.target.value })} rows={3}
                  placeholder="Section content" className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" />
              )}
              {sections.enabled[key] && key === 'offers' && (
                <OffersEditor sections={sections} setSections={setSections} />
              )}
            </div>
          )
        })}
      </div>
      <button type="button" onClick={addCustom} className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs font-semibold text-primary-600 hover:border-primary-400">
        + Add custom section
      </button>
    </div>
  )
}

function OffersEditor({ sections, setSections }: { sections: CardSections; setSections: (s: CardSections) => void }) {
  const offers = sections.offers
  const update = (i: number, patch: any) => {
    const next = offers.map((o, idx) => (idx === i ? { ...o, ...patch } : o))
    setSections({ ...sections, offers: next })
  }
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-2">
      {offers.map((o, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input value={o.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Offer title" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
          <input value={o.body || ''} onChange={(e) => update(i, { body: e.target.value })} placeholder="Details" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
          <button type="button" onClick={() => setSections({ ...sections, offers: offers.filter((_, idx) => idx !== i) })} className="text-xs text-red-500">Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => setSections({ ...sections, offers: [...offers, { title: '', body: '', active: true }] })} className="text-xs font-semibold text-primary-600">+ Add offer</button>
    </div>
  )
}

/* ------------------------------- Media ------------------------------- */
function isVideoMedia(m: any): boolean {
  return typeof m?.mime === 'string' && m.mime.toLowerCase().startsWith('video/')
}

function MediaPanel({ cardId, config, reload }: any) {
  const [busy, setBusy] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const albums = config?.albums || []

  async function addAlbum() {
    if (!albumName.trim()) return
    setBusy(true)
    try { await jfetch(`/api/customer/albums`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: albumName }) }); setAlbumName(''); await reload() }
    catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }
  async function uploadToAlbum(albumId: string, files: FileList | null) {
    if (!files?.length) return
    const album = albums.find((a: any) => a.id === albumId)
    const current = album?.media?.length || 0
    if (current + files.length > MAX_ALBUM_MEDIA) {
      alert(`An album can hold up to ${MAX_ALBUM_MEDIA} items. This album already has ${current}.`)
      return
    }
    setBusy(true)
    try {
      const items: any[] = []
      for (const file of Array.from(files)) {
        const isVideo = (file.type || '').toLowerCase().startsWith('video/')
        const url = await uploadFile(file, { kind: isVideo ? 'video' : 'image' })
        items.push({ url, name: file.name, mime: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'), size: file.size })
      }
      await jfetch(`/api/customer/albums/${albumId}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
      await reload()
    } catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }
  async function removeMedia(id: string) {
    if (!confirm('Delete this item?')) return
    await jfetch(`/api/customer/media/${id}`, { method: 'DELETE' }); await reload()
  }
  async function removeAlbum(id: string) {
    if (!confirm('Delete this album and all its media?')) return
    await jfetch(`/api/customer/albums/${id}`, { method: 'DELETE' }); await reload()
  }
  async function moveMedia(album: any, index: number, dir: -1 | 1) {
    const media = album.media
    const next = index + dir
    if (next < 0 || next >= media.length) return
    await jfetch(`/api/customer/media/${media[index].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: next }) })
    await jfetch(`/api/customer/media/${media[next].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: index }) })
    await reload()
  }

  return (
    <div className="space-y-4">
      <VideosPanel />
      <div className="flex gap-2">
        <input value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="New album name (e.g. Products)" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <button onClick={addAlbum} disabled={busy} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add album</button>
      </div>
      {albums.length === 0 && <p className="text-sm text-gray-400">No albums yet. Create an album and upload photos.</p>}
      {albums.map((album: any) => (
        <div key={album.id} className="rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-700">{album.name} <span className="text-xs text-gray-400">({album.media.length}/{MAX_ALBUM_MEDIA})</span></p>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                {busy ? '...' : 'Upload'}
                <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={(e) => uploadToAlbum(album.id, e.target.files)} />
              </label>
              <button onClick={() => removeAlbum(album.id)} className="text-xs text-red-500">Delete album</button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {album.media.map((m: any, i: number) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                {isVideoMedia(m) ? (
                  <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                {isVideoMedia(m) && (
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">VIDEO</span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => moveMedia(album, i, -1)} className="text-white">←</button>
                  <button onClick={() => moveMedia(album, i, 1)} className="text-white">→</button>
                  <button onClick={() => removeMedia(m.id)} className="text-red-300">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------ Videos ------------------------------- */
function VideosPanel() {
  const [videos, setVideos] = useState<any[]>([])
  const [max, setMax] = useState(MAX_VIDEOS)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await jfetch(`/api/customer/videos`)
      setVideos(Array.isArray(data?.videos) ? data.videos : [])
      setMax(Number(data?.max) || MAX_VIDEOS)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    if (videos.length + files.length > max) {
      setError(`Maximum ${max} videos allowed per card (already ${videos.length}).`)
      return
    }
    setBusy(true)
    setError('')
    setProgress(0)
    try {
      const items: any[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, { kind: 'video', onProgress: setProgress })
        items.push({ url, name: file.name, size: file.size, mime: file.type || 'video/mp4' })
      }
      await jfetch(`/api/customer/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  async function remove(index: number) {
    if (!confirm('Remove this video?')) return
    setBusy(true)
    try {
      await jfetch(`/api/customer/videos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= videos.length) return
    const reordered = [...videos]
    ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
    setVideos(reordered)
    try {
      await jfetch(`/api/customer/videos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: reordered }),
      })
      await load()
    } catch (e: any) {
      setError(e.message)
      await load()
    }
  }

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">Videos</p>
          <p className="text-xs text-gray-400">MP4, WebM or MOV · max {formatFileSize(MAX_VIDEO_BYTES)} each · up to {max} per card</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${videos.length >= max ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
          {videos.length} / {max}
        </span>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}

      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v: any, i: number) => (
            <div key={`${v.url}-${i}`} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2">
              <video src={v.url} className="h-11 w-16 flex-shrink-0 rounded-md bg-gray-100 object-cover" muted playsInline preload="metadata" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-700" title={v.name}>{v.name || 'Video'}</p>
                <p className="text-[11px] text-gray-400">{formatFileSize(v.size)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded p-1 text-gray-300 hover:text-gray-600">↑</button>
                <button type="button" onClick={() => move(i, 1)} className="rounded p-1 text-gray-300 hover:text-gray-600">↓</button>
                <button type="button" onClick={() => remove(i)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {videos.length < max && (
        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary-200 bg-white py-4 text-xs font-semibold text-primary-600 transition-colors hover:border-primary-400 ${busy || loading ? 'pointer-events-none opacity-50' : ''}`}>
          <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = '' }} disabled={busy || loading} />
          {busy ? (progress > 0 ? `Uploading... ${progress}%` : 'Uploading...') : 'Upload video'}
        </label>
      )}
    </div>
  )
}

/* ------------------------------ Products ----------------------------- */
const EMPTY_PRODUCT = { name: '', description: '', imageUrl: '', mrp: '', price: '', discountPct: '', stockStatus: 'in_stock', categoryId: '', attributes: '', active: true }

function productsToForm(p: any) {
  const attrs = parseAttributes(p.attributes)
  return {
    name: p.name || '',
    description: p.description || '',
    imageUrl: p.imageUrl || '',
    mrp: p.mrp != null ? String(p.mrp) : '',
    price: p.price != null ? String(p.price) : '',
    discountPct: p.discountPct != null ? String(p.discountPct) : '',
    stockStatus: p.stockStatus || 'in_stock',
    categoryId: p.categoryId || '',
    attributes: Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join('\n'),
    active: p.active !== false,
  }
}

function ProductsPanel({ cardId, config, reload }: any) {
  const [form, setForm] = useState<any>({ ...EMPTY_PRODUCT })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const categories = config?.categories || []
  const products = config?.products || []

  function resetForm() { setForm({ ...EMPTY_PRODUCT }); setEditingId(null) }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file, { kind: 'image' })
      setForm((f: any) => ({ ...f, imageUrl: url }))
    } catch (err: any) { alert(err.message) } finally { setUploading(false) }
  }

  async function submitProduct() {
    if (!form.name.trim()) return alert('Product name is required.')
    setBusy(true)
    try {
      const attributes = form.attributes
        ? Object.fromEntries(form.attributes.split('\n').map((l: string) => l.split(':').map((s: string) => s.trim())).filter((p: string[]) => p[0] && p[1]))
        : {}
      const payload = {
        ...form,
        mrp: form.mrp || null,
        price: form.price || null,
        discountPct: form.discountPct || null,
        categoryId: form.categoryId || null,
        attributes,
      }
      if (editingId) {
        await jfetch(`/api/admin/products/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await jfetch(`/api/admin/cards/${cardId}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      resetForm(); await reload()
    } catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }

  async function addCategory() {
    if (!catName.trim()) return
    await jfetch(`/api/admin/cards/${cardId}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catName }) })
    setCatName(''); await reload()
  }
  async function removeProduct(id: string) {
    if (!confirm('Delete product?')) return
    await jfetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    await reload()
  }
  async function toggleActive(p: any) {
    await jfetch(`/api/admin/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !p.active }) })
    await reload()
  }
  async function move(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= products.length) return
    await jfetch(`/api/admin/products/${products[index].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: next }) })
    await jfetch(`/api/admin/products/${products[next].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: index }) })
    await reload()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-500">Categories</p>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c: any) => <span key={c.id} className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow-sm">{c.name}</span>)}
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category" className="rounded-lg border border-gray-200 px-2 py-1 text-xs" />
          <button onClick={addCategory} className="text-xs font-semibold text-primary-600">+ Add</button>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-gray-100 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">{editingId ? 'Edit product' : 'Add product'}</p>
          {editingId && <button onClick={resetForm} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Cancel edit</button>}
        </div>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name *" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <input value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} placeholder="MRP" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Selling price" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <input value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} placeholder="Discount %" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option><option value="pre_order">Pre-order</option>
          </select>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Image URL" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <label className="cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
            {uploading ? '...' : 'Upload'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
          </label>
          {form.imageUrl && <img src={form.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />}
        </div>
        <textarea value={form.attributes} onChange={(e) => setForm({ ...form, attributes: e.target.value })} rows={2} placeholder="Attributes (one per line): Brand: Samsung" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Description" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-primary-600" /> Visible on card
        </label>
        <button onClick={submitProduct} disabled={busy} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50">{busy ? 'Saving...' : editingId ? 'Save changes' : 'Add product'}</button>
      </div>

      <div className="space-y-2">
        {products.length === 0 && <p className="text-sm text-gray-400">No products yet.</p>}
        {products.map((p: any, i: number) => {
          const attrs = parseAttributes(p.attributes)
          return (
            <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-2 transition ${editingId === p.id ? 'border-primary-300 bg-primary-50/40' : 'border-gray-100'}`}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">IMG</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{p.name} {p.active === false && <span className="ml-1 rounded bg-gray-200 px-1.5 text-[10px] text-gray-500">hidden</span>}</p>
                <p className="text-xs text-gray-400">{p.price != null ? formatInr(p.price) : '—'}{attrs.brand ? ` · ${attrs.brand}` : ''} {Object.keys(attrs).length ? `· ${Object.keys(attrs).length} specs` : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} className="rounded p-1 text-gray-300 hover:text-gray-600">↑</button>
                <button onClick={() => move(i, 1)} className="rounded p-1 text-gray-300 hover:text-gray-600">↓</button>
                <button onClick={() => toggleActive(p)} className="rounded p-1 text-xs text-gray-400 hover:text-gray-600">{p.active === false ? 'Show' : 'Hide'}</button>
                <button onClick={() => { setEditingId(p.id); setForm(productsToForm(p)) }} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50">Edit</button>
                <button onClick={() => removeProduct(p.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------- Catalogues ---------------------------- */
function CataloguesPanel({ config, reload }: any) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('catalogue')
  const [busy, setBusy] = useState(false)
  const catalogues = config?.catalogues || []

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadFile(file, { kind: 'document' })
      await jfetch(`/api/customer/catalogues`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || file.name.replace(/\.pdf$/i, ''), kind, url, size: file.size }),
      })
      setTitle(''); await reload()
    } catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }
  async function remove(id: string) { if (confirm('Delete document?')) { await jfetch(`/api/customer/catalogues/${id}`, { method: 'DELETE' }); await reload() } }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-gray-100 p-3">
        <p className="text-sm font-semibold text-gray-700">Add catalogue / brochure (PDF)</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="catalogue">Catalogue</option><option value="price_list">Price list</option><option value="brochure">Brochure</option><option value="menu">Menu</option>
        </select>
        <label className="inline-block cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
          {busy ? 'Uploading...' : 'Choose PDF'}
          <input type="file" accept="application/pdf" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0] || null)} />
        </label>
      </div>
      {catalogues.map((c: any) => (
        <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
          <span className="text-red-500">PDF</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{c.title}</p>
            <p className="text-xs text-gray-400">{c.kind} · {formatFileSize(c.size)}</p>
          </div>
          <button onClick={() => remove(c.id)} className="text-xs text-red-500">Delete</button>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------- EMI -------------------------------- */
function EmiPanel({ enabled, setEnabled, value, setValue, saved, saving, onSave }: any) {
  const toNumber = (v: any, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  const minTenure = Math.max(1, Math.round(toNumber(value.minTenure, 3)))
  const maxTenure = Math.max(minTenure, Math.round(toNumber(value.maxTenure, 60)))
  const defaultTenure = Math.min(maxTenure, Math.max(minTenure, Math.round(toNumber(value.defaultTenure, 12))))

  const upd = (patch: any) => setValue({ ...value, ...patch })
  const updTenure = (patch: any) => {
    const next = { ...value, ...patch }
    const min = Math.max(1, Math.round(toNumber(next.minTenure, 3)))
    const max = Math.max(min, Math.round(toNumber(next.maxTenure, 60)))
    setValue({
      ...next,
      minTenure: min,
      maxTenure: max,
      defaultTenure: Math.min(max, Math.max(min, Math.round(toNumber(next.defaultTenure, 12)))),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-primary-600" />
          Show EMI on Digital Profile
        </label>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${saved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          Live: {saved ? 'Shown' : 'Hidden'}
        </span>
      </div>
      <p className="text-xs text-gray-500">Controls the EMI card on this customer's public profile (NFC tap, profile link and QR). It applies only to this card, takes effect as soon as it is saved, and does not depend on the Sections list or publish status.</p>
      {enabled && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-gray-500">Default interest rate (% p.a.)
            <input type="number" min="0" max="100" step="0.01" value={value.defaultRate} onChange={(e) => upd({ defaultRate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Processing fee (₹)
            <input type="number" min="0" step="1" value={value.processingFee} onChange={(e) => upd({ processingFee: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Min tenure (months)
            <input type="number" min="1" step="1" value={minTenure} onChange={(e) => updTenure({ minTenure: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Max tenure (months)
            <input type="number" min={minTenure} step="1" value={maxTenure} onChange={(e) => updTenure({ maxTenure: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Default tenure (months)
            <input type="number" min={minTenure} max={maxTenure} step="1" value={defaultTenure} onChange={(e) => updTenure({ defaultTenure: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
        </div>
      )}
      <p className="text-xs text-gray-400">Customers can adjust price, down payment, rate and tenure. Calculations are illustrative only and do not constitute a loan offer.</p>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save EMI setting'}</button>
        {enabled !== saved && <span className="text-xs font-medium text-amber-600">Unsaved change</span>}
      </div>
    </div>
  )
}

/* ------------------------------ Settings ----------------------------- */
function SettingsPanel({ templates, templateId, applyTemplate, industry, setIndustry, slug, setSlug }: any) {
  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold text-gray-500">Industry template
        <select value={templateId} onChange={(e) => applyTemplate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">— Select a template —</option>
          {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-gray-500">Industry key
        <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
      </label>
      <label className="block text-xs font-semibold text-gray-500">Custom URL slug
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-gray-400">/p/</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-business" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>
      </label>
      <p className="text-xs text-gray-400">Applying a template loads its colours and sections. Your products, gallery and catalogues are kept. Remember to Save.</p>
    </div>
  )
}

/* ------------------------------ Preview ------------------------------ */
function CardPreview({ theme, sections, customer, config }: any) {
  const hero = config?.profileImage || customer?.logoUrl
  const bg = theme.headerStyle === 'solid' ? theme.primary : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
  const enabled = (sections.order || [])
    .filter((key: string) => sections.enabled[key])
    .map((key: string) => {
      const meta = SECTION_REGISTRY.find((s) => s.key === key)
      if (meta) return { key, label: sections.titles[key] || meta.label }
      const custom = (sections.custom || []).find((c: any) => c.key === key)
      return custom ? { key, label: custom.title } : null
    })
    .filter(Boolean) as { key: string; label: string }[]
  return (
    <div className="lg:sticky lg:top-4 lg:self-start">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Live preview</p>
      <div className={`mx-auto w-full max-w-[300px] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg ${FONT_CLASS[theme.font as keyof typeof FONT_CLASS]}`}>
        <div className="p-5 text-center text-white" style={{ background: bg }}>
          <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
            {hero ? <img src={hero} alt="" className="h-full w-full object-cover object-top" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-bold">{customer?.name?.charAt(0) || '?'}</div>}
          </div>
          <p className="text-lg font-bold leading-tight">{customer?.name || 'Customer name'}</p>
          {customer?.designation && <p className="text-xs text-white/80">{customer.designation}</p>}
          {customer?.company && <p className="text-xs text-white/80">{customer.company}</p>}
        </div>
        <div className="space-y-1.5 p-4">
          {enabled.map((s) => (
            <div key={s.key} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {s.label}
            </div>
          ))}
          {enabled.length === 0 && <p className="text-center text-xs text-gray-400">No sections enabled</p>}
        </div>
      </div>
    </div>
  )
}
