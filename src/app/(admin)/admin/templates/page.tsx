"use client"
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SECTION_REGISTRY, normalizeSections, normalizeTheme, type CardSections, type CardTheme } from '@/lib/builder'

async function jfetch(url: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(url, { ...init, headers: { ...(init?.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`)
  return data.data
}

interface FieldDef { key: string; label: string; placeholder?: string }

interface Draft {
  id?: string
  name: string
  industry: string
  category: string
  description: string
  icon: string
  active: boolean
  isSystem?: boolean
  theme: CardTheme
  sections: CardSections
  fieldDefs: FieldDef[]
}

function blankDraft(): Draft {
  return {
    name: '', industry: '', category: 'General', description: '', icon: 'grid', active: true,
    theme: normalizeTheme(null), sections: normalizeSections(null), fieldDefs: [],
  }
}

function fromTemplate(t: any): Draft {
  let config: any = {}
  try { config = JSON.parse(t.config || '{}') } catch { config = {} }
  return {
    id: t.id, name: t.name, industry: t.industry, category: t.category,
    description: t.description || '', icon: t.icon || 'grid', active: t.active, isSystem: t.isSystem,
    theme: normalizeTheme(config.theme), sections: normalizeSections(config.sections),
    fieldDefs: Array.isArray(config.fieldDefs) ? config.fieldDefs : [],
  }
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const data = await jfetch(`/api/admin/templates?${params}`)
      setTemplates(data.templates)
      setCategories(data.categories)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }, [search, categoryFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!draft) return
    if (!draft.name.trim()) return alert('Template name is required.')
    setSaving(true); setError('')
    try {
      const body = {
        name: draft.name, category: draft.category, description: draft.description, icon: draft.icon,
        active: draft.active, theme: draft.theme, sections: draft.sections, fieldDefs: draft.fieldDefs,
      }
      if (draft.id) await jfetch(`/api/admin/templates/${draft.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      else await jfetch('/api/admin/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setDraft(null)
      await load()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  async function toggleActive(t: any) {
    try {
      await jfetch(`/api/admin/templates/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !t.active }) })
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)))
    } catch (e: any) { alert(e.message) }
  }

  async function remove(t: any) {
    if (!confirm(`Delete template "${t.name}"?`)) return
    try { await jfetch(`/api/admin/templates/${t.id}`, { method: 'DELETE' }); await load() }
    catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Industry Templates</h1>
          <p className="text-sm text-gray-500">Reusable card presets — theme, sections and suggested custom fields.</p>
        </div>
        <button onClick={() => setDraft(blankDraft())} className="btn btn-primary w-full md:w-auto">+ New template</button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="input-field flex-1" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field sm:w-56" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-100" />)}</div> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const d = fromTemplate(t)
            const enabledCount = Object.values(d.sections.enabled).filter(Boolean).length
            return (
              <div key={t.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-800">{t.name}</h3>
                    <p className="text-xs text-gray-400">{t.category}</p>
                  </div>
                  <span className="flex gap-1">
                    {t.isSystem && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">Built-in</span>}
                    <button onClick={() => toggleActive(t)} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.active ? 'Active' : 'Inactive'}</button>
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{t.description || 'No description'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full ring-1 ring-black/5" style={{ background: `linear-gradient(135deg, ${d.theme.primary}, ${d.theme.secondary})` }} />
                  <span className="text-xs text-gray-400">{enabledCount} sections</span>
                </div>
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => setDraft(fromTemplate(t))} className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200">Edit</button>
                  {!t.isSystem && <button onClick={() => remove(t)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50">Delete</button>}
                </div>
              </div>
            )
          })}
          {templates.length === 0 && <p className="col-span-full py-10 text-center text-sm text-gray-400">No templates found.</p>}
        </div>
      )}

      {draft && <TemplateEditor draft={draft} setDraft={setDraft} onSave={save} onClose={() => setDraft(null)} saving={saving} />}
    </div>
  )
}

function TemplateEditor({ draft, setDraft, onSave, onClose, saving }: { draft: Draft; setDraft: (d: Draft) => void; onSave: () => void; onClose: () => void; saving: boolean }) {
  const [tab, setTab] = useState<'basics' | 'theme' | 'sections' | 'fields'>('basics')
  const enabledCount = useMemo(() => Object.values(draft.sections.enabled).filter(Boolean).length, [draft.sections])

  const upd = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const updTheme = (patch: Partial<CardTheme>) => setDraft({ ...draft, theme: { ...draft.theme, ...patch } })
  const toggleSection = (key: string) => setDraft({ ...draft, sections: { ...draft.sections, enabled: { ...draft.sections.enabled, [key]: !draft.sections.enabled[key] } } })
  const setTitle = (key: string, v: string) => setDraft({ ...draft, sections: { ...draft.sections, titles: { ...draft.sections.titles, [key]: v } } })

  const updField = (i: number, patch: Partial<FieldDef>) => setDraft({ ...draft, fieldDefs: draft.fieldDefs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-800">{draft.id ? 'Edit template' : 'New template'}{draft.isSystem ? ' (built-in)' : ''}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100">✕</button>
        </div>

        <div className="flex gap-1 border-b border-gray-100 px-3 py-2">
          {([['basics', 'Basics'], ['theme', 'Theme'], ['sections', `Sections (${enabledCount})`], ['fields', 'Fields']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}>{label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'basics' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500">Name
                <input className="input-field mt-1" value={draft.name} onChange={(e) => upd({ name: e.target.value })} placeholder="e.g. Dental Clinic" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-gray-500">Category
                  <input className="input-field mt-1" value={draft.category} onChange={(e) => upd({ category: e.target.value })} placeholder="Healthcare" />
                </label>
                <label className="block text-xs font-semibold text-gray-500">Icon
                  <input className="input-field mt-1" value={draft.icon} onChange={(e) => upd({ icon: e.target.value })} placeholder="grid" />
                </label>
              </div>
              <label className="block text-xs font-semibold text-gray-500">Description
                <textarea className="input-field mt-1" rows={3} value={draft.description} onChange={(e) => upd({ description: e.target.value })} />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={draft.active} onChange={(e) => upd({ active: e.target.checked })} className="accent-primary-600" /> Active (available in the builder)
              </label>
            </div>
          )}

          {tab === 'theme' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-gray-500">Primary colour
                  <input type="color" value={draft.theme.primary} onChange={(e) => updTheme({ primary: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200" />
                </label>
                <label className="text-xs font-semibold text-gray-500">Secondary colour
                  <input type="color" value={draft.theme.secondary} onChange={(e) => updTheme({ secondary: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200" />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-gray-500">Header
                  <select className="input-field mt-1" value={draft.theme.headerStyle} onChange={(e) => updTheme({ headerStyle: e.target.value as any })}>
                    <option value="gradient">Gradient</option><option value="solid">Solid</option><option value="glass">Glass</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-gray-500">Layout
                  <select className="input-field mt-1" value={draft.theme.layout} onChange={(e) => updTheme({ layout: e.target.value as any })}>
                    <option value="classic">Classic</option><option value="modern">Modern</option><option value="compact">Compact</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-gray-500">Font
                  <select className="input-field mt-1" value={draft.theme.font} onChange={(e) => updTheme({ font: e.target.value as any })}>
                    <option value="sans">Sans</option><option value="serif">Serif</option><option value="rounded">Rounded</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {tab === 'sections' && (
            <div className="space-y-2">
              {SECTION_REGISTRY.map((s) => (
                <div key={s.key} className="flex items-center gap-2 rounded-xl border border-gray-100 p-2.5">
                  <label className="flex flex-1 items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={!!draft.sections.enabled[s.key]} onChange={() => toggleSection(s.key)} className="accent-primary-600" />
                    {s.label}
                  </label>
                  <input value={draft.sections.titles[s.key] || ''} onChange={(e) => setTitle(s.key, e.target.value)} className="w-44 rounded-lg border border-gray-200 px-2 py-1 text-xs" placeholder="Title" />
                </div>
              ))}
            </div>
          )}

          {tab === 'fields' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Suggest extra fields this industry usually needs. These are hints shown to the business owner.</p>
              {draft.fieldDefs.map((f, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input value={f.key} onChange={(e) => updField(i, { key: e.target.value })} placeholder="key" className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                  <input value={f.label} onChange={(e) => updField(i, { label: e.target.value })} placeholder="Label" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                  <input value={f.placeholder || ''} onChange={(e) => updField(i, { placeholder: e.target.value })} placeholder="Placeholder / hint" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                  <button onClick={() => setDraft({ ...draft, fieldDefs: draft.fieldDefs.filter((_, idx) => idx !== i) })} className="text-xs text-red-500">✕</button>
                </div>
              ))}
              <button onClick={() => setDraft({ ...draft, fieldDefs: [...draft.fieldDefs, { key: '', label: '', placeholder: '' }] })} className="text-xs font-semibold text-primary-600">+ Add field</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={onSave} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save template'}</button>
        </div>
      </div>
    </div>
  )
}
