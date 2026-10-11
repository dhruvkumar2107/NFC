export interface EmiInput {
  price: number
  downPayment?: number
  annualRate: number
  tenureMonths: number
  processingFee?: number
}

export interface EmiResult {
  price: number
  downPayment: number
  principal: number
  annualRate: number
  tenureMonths: number
  monthlyRate: number
  emi: number
  totalInterest: number
  totalPayable: number
  processingFee: number
  totalWithFees: number
  breakdown: { label: string; value: number }[]
}

export interface EmiValidation {
  ok: boolean
  errors: string[]
}

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

export function validateEmiInput(input: Partial<EmiInput>): EmiValidation {
  const errors: string[] = []
  const price = Number(input.price)
  const down = Number(input.downPayment ?? 0)
  const rate = Number(input.annualRate)
  const tenure = Number(input.tenureMonths)

  if (!Number.isFinite(price) || price <= 0) errors.push('Enter a valid product price greater than 0.')
  if (!Number.isFinite(down) || down < 0) errors.push('Down payment cannot be negative.')
  if (Number.isFinite(price) && Number.isFinite(down) && down > price) errors.push('Down payment cannot exceed the price.')
  if (!Number.isFinite(rate) || rate < 0) errors.push('Interest rate cannot be negative.')
  if (rate > 100) errors.push('Interest rate looks unrealistic (must be 100% or less).')
  if (!Number.isFinite(tenure) || tenure < 1) errors.push('Tenure must be at least 1 month.')
  if (tenure > 600) errors.push('Tenure cannot exceed 600 months.')

  return { ok: errors.length === 0, errors }
}

/**
 * Standard reducing-balance EMI:
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * P = principal (price - down payment), r = monthly rate, n = number of months.
 * Zero-interest loans fall back to a simple equal split.
 */
export function calculateEmi(input: EmiInput): EmiResult {
  const price = Number(input.price) || 0
  const downPayment = Math.max(0, Number(input.downPayment) || 0)
  const annualRate = Math.max(0, Number(input.annualRate) || 0)
  const tenureMonths = Math.max(1, Math.round(Number(input.tenureMonths) || 0))
  const processingFee = Math.max(0, Number(input.processingFee) || 0)

  const principal = Math.max(0, price - downPayment)
  const monthlyRate = annualRate / 12 / 100

  let emi: number
  if (principal === 0) {
    emi = 0
  } else if (monthlyRate === 0) {
    emi = principal / tenureMonths
  } else {
    const factor = Math.pow(1 + monthlyRate, tenureMonths)
    emi = (principal * monthlyRate * factor) / (factor - 1)
  }

  const totalPayable = emi * tenureMonths
  const totalInterest = Math.max(0, totalPayable - principal)
  const totalWithFees = totalPayable + processingFee

  return {
    price: round2(price),
    downPayment: round2(downPayment),
    principal: round2(principal),
    annualRate,
    tenureMonths,
    monthlyRate,
    emi: round2(emi),
    totalInterest: round2(totalInterest),
    totalPayable: round2(totalPayable),
    processingFee: round2(processingFee),
    totalWithFees: round2(totalWithFees),
    breakdown: [
      { label: 'Loan amount', value: round2(principal) },
      { label: 'Total interest', value: round2(totalInterest) },
      { label: 'Total payable (principal + interest)', value: round2(totalPayable) },
      ...(processingFee > 0 ? [{ label: 'Processing fee', value: round2(processingFee) }] : []),
      { label: 'Grand total payable', value: round2(totalWithFees) },
    ],
  }
}

export function formatInr(value: number): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
