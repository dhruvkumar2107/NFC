"use client"
import { useCallback, useEffect, useState } from 'react'

async function jfetch(url: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`)
  return data.data
}

const RANGES = [7, 30, 90]

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        {accent && <span className={`h-2 w-2 rounded-full ${accent}`} />}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

export interface AnalyticsDashboardProps {
  /** e.g. '/api/admin/analytics' or '/api/customer/analytics' */
  base: string
  heading?: string
  subtitle?: string
  /** Show platform-wide stats (cards active/total) — admin only. */
  showPlatform?: boolean
}

export default function AnalyticsDashboard({ base, heading = 'Analytics', subtitle, showPlatform = false }: AnalyticsDashboardProps) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await jfetch(`${base}?days=${days}`)) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }, [base, days])

  useEffect(() => { load() }, [load])

  async function exportCsv() {
    const token = localStorage.getItem('token')
    const res = await fetch(`${base}/export?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `analytics-${days}d.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const daily: any[] = data?.daily || []
  const maxViews = Math.max(1, ...daily.map((d) => d.card_view))
  const engagement: Record<string, number> = data?.engagement || {}
  const devices: any[] = data?.devices || []
  const deviceTotal = Math.max(1, devices.reduce((s, d) => s + d.count, 0))

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm">
            {RANGES.map((r) => (
              <button key={r} onClick={() => setDays(r)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${days === r ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{r}d</button>
            ))}
          </div>
          <button onClick={exportCsv} className="btn btn-secondary">Export CSV</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {loading || !data ? <div className="animate-pulse space-y-4"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}</div><div className="h-64 rounded-2xl bg-gray-100" /></div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Card views" value={data.visitors.visits} sub={`${data.visitors.events} total events`} accent="bg-primary-500" />
            <Stat label="Unique visitors" value={data.visitors.unique} accent="bg-blue-400" />
            <Stat label="Leads captured" value={data.leads.total} sub={`${data.leads.converted} converted`} accent="bg-green-500" />
            <Stat label="Conversion rate" value={`${data.leads.conversionRate}%`} accent="bg-emerald-400" />
            <Stat label="EMI calculations" value={data.emi.calculations} sub={data.emi.averageEmi ? `avg ₹${data.emi.averageEmi.toLocaleString('en-IN')}` : undefined} accent="bg-purple-500" />
            {showPlatform && <Stat label="Cards" value={`${data.cards.active}/${data.cards.total}`} sub="active / total" accent="bg-gray-400" />}
            <Stat label="Image downloads" value={engagement.image_download || 0} accent="bg-amber-500" />
            <Stat label="Contact saves" value={engagement.contact_download || 0} accent="bg-rose-400" />
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Visits over time</h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary-500" /> views</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-500" /> leads</span>
              </div>
            </div>
            <div className="flex h-48 items-end gap-1 overflow-x-auto">
              {daily.map((d) => (
                <div key={d.date} className="group flex min-w-[8px] flex-1 flex-col items-center justify-end" title={`${d.date}: ${d.card_view} views, ${d.enquiry_submitted} leads`}>
                  <div className="w-full rounded-t bg-primary-500/80 transition-all group-hover:bg-primary-600" style={{ height: `${(d.card_view / maxViews) * 100}%`, minHeight: d.card_view > 0 ? 3 : 0 }} />
                  {d.enquiry_submitted > 0 && <div className="mt-0.5 h-1 w-full rounded bg-green-500" />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>{daily[0]?.date}</span>
              <span>{daily[daily.length - 1]?.date}</span>
            </div>
          </div>

          <div className={`grid gap-6 ${showPlatform ? 'lg:grid-cols-2' : ''}`}>
            {showPlatform && (
              <div className="card">
                <h2 className="mb-3 font-semibold text-gray-800">Top cards</h2>
                {(data.topCards || []).length === 0 ? <p className="text-sm text-gray-400">No views recorded yet.</p> : (
                  <div className="space-y-2">
                    {data.topCards.map((c: any) => (
                      <div key={c.cardId} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-gray-700">{c.name} <span className="font-mono text-xs text-primary-600">{c.cardId}</span></p>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${(c.views / Math.max(1, data.topCards[0].views)) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{c.views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <h2 className="mb-3 font-semibold text-gray-800">Devices</h2>
              {devices.length === 0 ? <p className="text-sm text-gray-400">No data yet.</p> : (
                <div className="space-y-2">
                  {devices.map((d) => (
                    <div key={d.device} className="flex items-center gap-3">
                      <span className="w-16 text-xs capitalize text-gray-500">{d.device}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${(d.count / deviceTotal) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-semibold text-gray-800">Engagement breakdown</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(engagement).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-gray-50 p-3">
                  <div className="text-lg font-bold text-gray-800">{v}</div>
                  <div className="text-xs capitalize text-gray-500">{k.replace(/_/g, ' ')}</div>
                </div>
              ))}
              {Object.keys(engagement).length === 0 && <p className="text-sm text-gray-400">No engagement events yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
