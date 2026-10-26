"use client"

import { useId, useState } from 'react'
import EmiCalculator from './EmiCalculator'
import { formatInr } from '@/lib/emi'
import type { PublicEmiConfig } from '@/lib/card-data'

interface Props {
  cardId: string
  config: PublicEmiConfig
  title?: string
  whatsapp?: string | null
  onEnquire?: (data: Record<string, any>) => void
}

/** Compact EMI summary that expands into the full calculator. Only rendered when the admin has enabled EMI. */
export default function EmiOptionsCard({ cardId, config, title, whatsapp, onEnquire }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  // Only the terms the admin actually saved are shown; nothing is shown when none were saved.
  const facts: string[] = []
  if (config.configured) {
    facts.push(`${config.defaultRate}% p.a. indicative`)
    facts.push(config.minTenure === config.maxTenure ? `${config.minTenure} months` : `${config.minTenure}–${config.maxTenure} months`)
    if (config.processingFee > 0) facts.push(`${formatInr(config.processingFee)} processing fee`)
  }

  return (
    <div id="msc-emi" className="glass-subtle scroll-mt-4 rounded-2xl border border-primary-100/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
          <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-800">{title || 'EMI Options'}</p>
          <p className="mt-0.5 text-xs text-gray-500">Explore available monthly payment options.</p>
          {facts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {facts.map((f) => (
                <span key={f} className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={panelId}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2">
        {open ? 'Hide EMI Details' : 'View EMI Details'}
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>

      {open && (
        <div id={panelId} className="mt-3">
          <EmiCalculator cardId={cardId} config={config} whatsapp={whatsapp} onEnquire={onEnquire} embedded />
        </div>
      )}
    </div>
  )
}
