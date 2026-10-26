"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateEmi, formatInr, validateEmiInput } from '@/lib/emi'
import type { PublicEmiConfig } from '@/lib/card-data'

interface Props {
  cardId: string
  config: PublicEmiConfig
  onEnquire?: (data: Record<string, any>) => void
  whatsapp?: string | null
  /** Drops the outer surface when rendered inside another card. */
  embedded?: boolean
}

export default function EmiCalculator({ cardId, config, onEnquire, whatsapp, embedded = false }: Props) {
  const [price, setPrice] = useState('')
  const [downPayment, setDownPayment] = useState('0')
  // Without saved terms the rate starts blank so no default is presented as the business's rate.
  const [rate, setRate] = useState(config.configured ? String(config.defaultRate) : '')
  const [tenure, setTenure] = useState(String(config.defaultTenure))
  const [fee, setFee] = useState(String(config.processingFee || 0))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const input = {
    price: Number(price),
    downPayment: Number(downPayment) || 0,
    annualRate: Number(rate),
    tenureMonths: Number(tenure),
    processingFee: Number(fee) || 0,
  }

  const validation = useMemo(() => {
    const v = validateEmiInput(input)
    if (rate.trim() === '') return { ok: false, errors: [...v.errors, 'Enter the interest rate quoted by your lender.'] }
    return v
  }, [price, downPayment, rate, tenure, fee])
  const validationErrors = validation.errors
  const result = validation.ok ? calculateEmi(input) : null

  useEffect(() => {
    if (!validation.ok) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/public/${encodeURIComponent(cardId)}/emi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }).catch(() => {})
    }, 900)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [price, downPayment, rate, tenure, fee, validation.ok, cardId])

  function enquire() {
    if (!result) return
    const data = {
      price: result.price,
      downPayment: result.downPayment,
      principal: result.principal,
      annualRate: result.annualRate,
      tenureMonths: result.tenureMonths,
      emi: result.emi,
      totalInterest: result.totalInterest,
      totalPayable: result.totalPayable,
    }
    if (onEnquire) onEnquire(data)
  }

  const waText = result
    ? `Hello, I am interested in EMI finance.\nProduct price: ${formatInr(result.price)}\nDown payment: ${formatInr(result.downPayment)}\nEMI: ${formatInr(result.emi)}/month for ${result.tenureMonths} months.\nPlease share more details.`
    : ''

  return (
    <div className={embedded ? 'space-y-3' : 'glass-subtle rounded-2xl p-4 space-y-3'}>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-gray-500">
          Product / vehicle price
          <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="e.g. 250000" className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Down payment
          <input inputMode="numeric" value={downPayment} onChange={(e) => setDownPayment(e.target.value.replace(/[^0-9.]/g, ''))}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Interest rate (% p.a.)
          <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder={config.configured ? undefined : 'e.g. 12'} className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Tenure (months)
          <input inputMode="numeric" value={tenure} onChange={(e) => setTenure(e.target.value.replace(/[^0-9]/g, ''))}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="text-xs font-semibold text-gray-500 col-span-2">
          Processing fee / other charges (optional)
          <input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^0-9.]/g, ''))}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-800" />
        </label>
      </div>

      <input type="range" min={config.minTenure} max={config.maxTenure} value={Number(tenure) || config.defaultTenure}
        onChange={(e) => setTenure(e.target.value)} className="w-full accent-primary-600" aria-label="Tenure months" />

      {validationErrors.length > 0 && price !== '' && (
        <p className="text-xs text-red-500">{validationErrors[0]}</p>
      )}

      {result && (
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-4">
          <p className="text-[11px] uppercase tracking-wider text-primary-100 font-semibold">Estimated monthly EMI</p>
          <p className="text-3xl font-bold mt-1">{formatInr(result.emi)}<span className="text-sm font-medium text-primary-100">/month</span></p>
          <div className="mt-3 space-y-1 text-xs text-primary-100">
            <div className="flex justify-between"><span>Loan amount</span><span>{formatInr(result.principal)}</span></div>
            <div className="flex justify-between"><span>Total interest</span><span>{formatInr(result.totalInterest)}</span></div>
            <div className="flex justify-between"><span>Total payable</span><span>{formatInr(result.totalPayable)}</span></div>
            {result.processingFee > 0 && (
              <div className="flex justify-between"><span>Processing fee</span><span>{formatInr(result.processingFee)}</span></div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onEnquire && (
          <button type="button" onClick={enquire} disabled={!result}
            className="flex-1 min-w-[140px] rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            Get Finance Quote
          </button>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 min-w-[140px] rounded-xl bg-green-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700">
            Enquire on WhatsApp
          </a>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-gray-400">
        Illustrative calculation only. This is not a loan approval or a guaranteed financing offer. Actual interest rate,
        processing fee, eligibility and terms must be confirmed by the relevant lender.
      </p>
    </div>
  )
}
