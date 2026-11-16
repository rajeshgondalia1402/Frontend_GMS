import { toWhatsappNumber, whatsappLink } from '@/lib/whatsapp'
import type { SalaryPaymentMode, SalaryRecord } from '@/types/salary'

export const SALARY_REMARKS_MAX_LENGTH = 250

const MODE_LABELS: Record<SalaryPaymentMode, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
}

export const SALARY_MODE_OPTIONS = (Object.keys(MODE_LABELS) as SalaryPaymentMode[]).map((value) => ({
  value,
  label: MODE_LABELS[value],
}))

export function salaryModeLabel(mode: string | null | undefined): string {
  if (!mode) return '—'
  return MODE_LABELS[mode as SalaryPaymentMode] ?? mode
}

const pad2 = (value: number) => String(value).padStart(2, '0')

/** Today as `YYYY-MM-DD`, in the browser's local calendar. */
export function todayValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** This month as `YYYY-MM`. */
export function currentMonthValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

/** The first and last day of the month running now, as `YYYY-MM-DD`. */
export function currentMonthRange(now: Date = new Date()): { fromDate: string; toDate: string } {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const month = currentMonthValue(now)
  return { fromDate: `${month}-01`, toDate: `${month}-${pad2(lastDay)}` }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

/** `2026-11` -> `Nov 2026`. */
export function formatSalaryMonth(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})/.exec(value ?? '')
  if (!match) return value || '—'
  return `${MONTHS[Number(match[2]) - 1]} ${match[1]}`
}

/** `2026-11-05` -> `05-Nov-2026`, the app's date format, without a time zone shift. */
export function formatSalaryDay(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '')
  if (!match) return value || '—'
  return `${match[3]}-${MONTHS[Number(match[2]) - 1]}-${match[1]}`
}

/** Everything the salary slip message says. */
export interface SalarySlipMessageInput {
  garageName?: string | null
  /** Printed at the bottom so the staff member can call back on it. */
  garageMobile?: string | null
  staffName?: string | null
  staffRole?: string | null
  amount: number
  /** `YYYY-MM` */
  salaryMonth: string
  /** `YYYY-MM-DD` */
  paymentDate: string
  paymentMode: string
  remarks?: string | null
}

const slipMoney = (value: number) =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

/**
 * The salary slip as the staff member reads it on WhatsApp. Handed over
 * prefilled, like the payment receipt: the owner still presses send.
 */
export function salarySlipMessage(input: SalarySlipMessageInput): string {
  const garage = input.garageName?.trim() || 'our garage'
  const name = input.staffName?.trim()
  const role = input.staffRole?.trim()
  const month = formatSalaryMonth(input.salaryMonth)

  const lines: string[] = []
  lines.push(name ? `Namaste ${name} 🙏` : 'Namaste 🙏')
  lines.push('')
  lines.push(`Your salary for ${month} has been paid. Thank you for your hard work at ${garage}.`)
  lines.push('')
  lines.push('*SALARY SLIP*')
  if (name) lines.push(`Name: ${name}`)
  if (role) lines.push(`Role: ${role}`)
  lines.push(`Salary Month: ${month}`)
  lines.push(`Payment Date: ${formatSalaryDay(input.paymentDate)}`)
  lines.push(`Payment Mode: ${salaryModeLabel(input.paymentMode)}`)
  lines.push(`*Amount Paid: ${slipMoney(input.amount)}*`)
  if (input.remarks?.trim()) lines.push(`Remarks: ${input.remarks.trim()}`)
  lines.push('')
  lines.push('Please reply to this message if you have any question about this payment.')
  lines.push('')
  lines.push(`*${garage}*`)
  if (input.garageMobile?.trim()) lines.push(input.garageMobile.trim())

  return lines.join('\n')
}

/**
 * The `wa.me` link that opens the staff member's chat with their slip typed
 * in, or `undefined` when their mobile number is not one WhatsApp can use.
 */
export function salarySlipLink(
  record: SalaryRecord,
  garage: { garageName?: string | null; mobileNumber?: string | null } | null | undefined,
): string | undefined {
  const number = toWhatsappNumber(record.staff.mobileNumber)
  if (!number) return undefined
  return whatsappLink(
    number,
    salarySlipMessage({
      garageName: garage?.garageName,
      garageMobile: garage?.mobileNumber,
      staffName: record.staff.name,
      staffRole: record.staff.role,
      amount: record.amount,
      salaryMonth: record.salaryMonth,
      paymentDate: record.paymentDate,
      paymentMode: record.paymentMode,
      remarks: record.remarks,
    }),
  )
}
