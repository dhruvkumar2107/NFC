"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { uploadFile } from '@/lib/upload-client'
import { FONT_CLASS, SECTION_REGISTRY, normalizeSections, normalizeTheme, type CardSections, type CardTheme } from '@/lib/builder'
import { formatFileSize } from '@/lib/profile-media'
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

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await jfetch(`/api/admin/cards/${cardId}/builder`)
      const c = data.config
      setConfig(c)
      setCustomer(data.customer)
      setTheme(normalizeTheme(c.theme))
      setSections(normalizeSections(c.sections))
      setIndustry(c.industry || 'general')
      setSlug(c.slug || '')
      setStatus(c.status || 'draft')
      setEmiEnabled(!!c.emiEnabled)
      setTemplateId(c.templateId || '')
      if (c.emiConfig) setEmiConfig({
        defaultRate: c.emiConfig.defaultRate,
        minTenure: c.emiConfig.minTenure,
        maxTenure: c.emiConfig.maxTenure,
        defaultTenure: c.emiConfig.defaultTenure,
        processingFee: c.emiConfig.processingFee,
      })
      const tpl = await jfetch('/api/admin/templates')
      setTemplates(tpl.templates || [])
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
        emiEnabled,
        emiConfig,
        templateId: templateId || null,
        ...overrides,
      }
      const data = await jfetch(`/api/admin/cards/${cardId}/builder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setConfig(data.config)
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
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}>{t.label}</button>
            ))}
          </div>
          <div className="p-4">
            {tab === 'theme' && <ThemePanel theme={theme} setTheme={setTheme} sections={sections} customer={customer} onUploaded={(url: string) => save({ profileImage: url })} config={config} />}
            {tab === 'sections' && <SectionsPanel sections={sections} setSections={setSections} />}
            {tab === 'media' && <MediaPanel cardId={cardId} config={config} reload={load} />}
            {tab === 'products' && <ProductsPanel cardId={cardId} config={config} reload={load} />}
            {tab === 'catalogues' && <CataloguesPanel cardId={cardId} config={config} reload={load} />}
            {tab === 'emi' && <EmiPanel enabled={emiEnabled} setEnabled={setEmiEnabled} value={emiConfig} setValue={setEmiConfig} />}
            {tab === 'settings' && <SettingsPanel templates={templates} templateId={templateId} applyTemplate={applyTemplate} industry={industry} setIndustry={setIndustry} slug={slug} setSlug={setSlug} />}
          </div>
        </div>

        <CardPreview theme={theme} sections={sections} customer={customer} config={config} />
      </div>
    </div>
  )
}

/* ------------------------------- Theme ------------------------------- */
function ThemePanel({ theme, setTheme, sections, customer, onUploaded, config }: any) {
  const [uploading, setUploading] = useState(false)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file, { kind: 'image' })
      await onUploaded(url)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }
  const upd = (patch: Partial<CardTheme>) => setTheme({ ...theme, ...patch })
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
          {(config?.profileImage || customer?.logoUrl) && <img src={config?.profileImage || customer?.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />}
          <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
            {uploading ? 'Uploading...' : 'Upload photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Sections ----------------------------- */
function SectionsPanel({ sections, setSections }: { sections: CardSections; setSections: (s: CardSections) => void }) {
  const toggle = (key: string) => setSections({ ...sections, enabled: { ...sections.enabled, [key]: !sections.enabled[key] } })
  const setTitle = (key: string, v: string) => setSections({ ...sections, titles: { ...sections.titles, [key]: v } })
  const setField = (key: string, v: string) => setSections({ ...sections, fields: { ...sections.fields, [key]: v } })

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
          if (!meta) return null
          return (
            <div key={key} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => move(idx, -1)} className="text-gray-400 hover:text-gray-600">↑</button>
                <button type="button" onClick={() => move(idx, 1)} className="text-gray-400 hover:text-gray-600">↓</button>
                <label className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={!!sections.enabled[key]} onChange={() => toggle(key)} className="accent-primary-600" />
                  {meta.label}
                </label>
                <input value={sections.titles[key] || ''} onChange={(e) => setTitle(key, e.target.value)} className="w-40 rounded-lg border border-gray-200 px-2 py-1 text-xs" placeholder="Section title" />
              </div>
              {sections.enabled[key] && fieldSections.includes(key) && (
                <textarea value={sections.fields[key] || ''} onChange={(e) => setField(key, e.target.value)} rows={2}
                  placeholder={meta.description} className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" />
              )}
              {sections.enabled[key] && key === 'offers' && (
                <OffersEditor sections={sections} setSections={setSections} />
              )}
            </div>
          )
        })}
      </div>
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
function MediaPanel({ cardId, config, reload }: any) {
  const [busy, setBusy] = useState(false)
  const [albumName, setAlbumName] = useState('')
  async function addAlbum() {
    if (!albumName.trim()) return
    setBusy(true)
    try { await jfetch(`/api/admin/cards/${cardId}/albums`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: albumName }) }); setAlbumName(''); await reload() }
    catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }
  async function uploadToAlbum(albumId: string, files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    try {
      const items: any[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, { kind: 'image' })
        items.push({ url, name: file.name, mime: file.type || 'image/jpeg', size: file.size })
      }
      await jfetch(`/api/admin/albums/${albumId}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
      await reload()
    } catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }
  async function removeMedia(id: string) {
    if (!confirm('Delete this photo?')) return
    await jfetch(`/api/admin/media/${id}`, { method: 'DELETE' }); await reload()
  }
  async function removeAlbum(id: string) {
    if (!confirm('Delete this album and all its photos?')) return
    await jfetch(`/api/admin/albums/${id}`, { method: 'DELETE' }); await reload()
  }
  async function moveMedia(album: any, index: number, dir: -1 | 1) {
    const media = album.media
    const next = index + dir
    if (next < 0 || next >= media.length) return
    await jfetch(`/api/admin/media/${media[index].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: next }) })
    await jfetch(`/api/admin/media/${media[next].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: index }) })
    await reload()
  }

  const albums = config?.albums || []

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="New album name (e.g. Products)" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <button onClick={addAlbum} disabled={busy} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add album</button>
      </div>
      {albums.length === 0 && <p className="text-sm text-gray-400">No albums yet. Create an album and upload photos.</p>}
      {albums.map((album: any) => (
        <div key={album.id} className="rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-700">{album.name} <span className="text-xs text-gray-400">({album.media.length})</span></p>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                {busy ? '...' : 'Upload'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadToAlbum(album.id, e.target.files)} />
              </label>
              <button onClick={() => removeAlbum(album.id)} className="text-xs text-red-500">Delete album</button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {album.media.map((m: any, i: number) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={`/api/public/${config.card.cardId}/media/${m.id}?s=x`} alt="" className="h-full w-full object-cover" />
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
function CataloguesPanel({ cardId, config, reload }: any) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('catalogue')
  const [busy, setBusy] = useState(false)
  const catalogues = config?.catalogues || []

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadFile(file, { kind: 'document' })
      await jfetch(`/api/admin/cards/${cardId}/catalogues`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || file.name.replace(/\.pdf$/i, ''), kind, url, size: file.size }),
      })
      setTitle(''); await reload()
    } catch (e: any) { alert(e.message) } finally { setBusy(false) }
  }
  async function remove(id: string) { if (confirm('Delete document?')) { await jfetch(`/api/admin/catalogues/${id}`, { method: 'DELETE' }); await reload() } }

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
function EmiPanel({ enabled, setEnabled, value, setValue }: any) {
  const upd = (patch: any) => setValue({ ...value, ...patch })
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-primary-600" />
        Enable EMI / finance calculator on this card
      </label>
      {enabled && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-gray-500">Default interest rate (% p.a.)
            <input type="number" value={value.defaultRate} onChange={(e) => upd({ defaultRate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Processing fee (₹)
            <input type="number" value={value.processingFee} onChange={(e) => upd({ processingFee: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Min tenure (months)
            <input type="number" value={value.minTenure} onChange={(e) => upd({ minTenure: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Max tenure (months)
            <input type="number" value={value.maxTenure} onChange={(e) => upd({ maxTenure: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Default tenure (months)
            <input type="number" value={value.defaultTenure} onChange={(e) => upd({ defaultTenure: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
        </div>
      )}
      <p className="text-xs text-gray-400">Customers can adjust price, down payment, rate and tenure. Calculations are illustrative only and do not constitute a loan offer.</p>
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
  const enabled = SECTION_REGISTRY.filter((s) => sections.enabled[s.key])
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
              {sections.titles[s.key] || s.label}
            </div>
          ))}
          {enabled.length === 0 && <p className="text-center text-xs text-gray-400">No sections enabled</p>}
        </div>
      </div>
    </div>
  )
}
