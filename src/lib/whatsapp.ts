import { formatMoney } from '@/lib/jobCard'
import { paymentMethodLabel } from '@/lib/payment'
import { formatDayMonthYear } from '@/lib/utils'
import type { JobCardMoney, PaymentMethod } from '@/types/payment'

/**
 * India. Every number the app stores is the ten digits after it — the customer
 * form will not take anything else — so that is what is put in front.
 */
const COUNTRY_CODE = '91'

const MOBILE_DIGITS = 10

/**
 * A number in the form `wa.me` wants: digits only, country code included, no
 * `+`. `null` for anything that could not be one, which is what hides the
 * send button rather than opening a chat with nobody.
 */
export function toWhatsappNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length === MOBILE_DIGITS) return `${COUNTRY_CODE}${digits}`
  // Already carries a country code — 91 followed by the ten, or another
  // country's. Left as it is rather than guessed at.
  if (digits.length > MOBILE_DIGITS && digits.length <= 15) return digits
  return null
}

/**
 * The customer's own WhatsApp number, falling back to the mobile one. Both are
 * asked for on the customer form, and the WhatsApp field is usually a mirror of
 * the mobile, so either will do.
 */
export function customerWhatsappNumber(customer?: {
  whatsappNumber?: string | null
  mobileNumber?: string | null
}): string | null {
  return (
    toWhatsappNumber(customer?.whatsappNumber) ?? toWhatsappNumber(customer?.mobileNumber)
  )
}

/** Everything the receipt message says, gathered from the screen sending it. */
export interface PaymentReceiptMessageInput {
  garageName?: string | null
  /** Printed at the bottom so the customer can call back on it. */
  garageMobile?: string | null
  customerName?: string | null
  /** `Hyundai Creta`, for the line that thanks them for the vehicle. */
  vehicleName?: string | null
  vehicleNumber?: string | null
  jobNumber: string
  /** The receipt being sent — what was taken, how, and when. */
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  /** The card as it stands after that receipt. */
  money: Pick<JobCardMoney, 'totalAmount' | 'remainingAmount'>
}

/** `*bold*` is WhatsApp's own markup; the figures are what carry the message. */
function bold(text: string): string {
  return `*${text}*`
}

function receiptDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? formatDayMonthYear(new Date()) : formatDayMonthYear(date)
}


/**
 * The receipt as the customer reads it on their phone: who it is from, thanks
 * for the visit, then the three figures that matter — what was taken just now,
 * what the bill came to, and what is still owing.
 *
 * Written to be sent as it stands. The owner can still edit it in WhatsApp
 * before hitting send, which is the point of handing it over prefilled rather
 * than sending it behind their back.
 */
export function paymentReceiptMessage(input: PaymentReceiptMessageInput): string {
  const garage = input.garageName?.trim() || 'our garage'
  const customer = input.customerName?.trim()
  const vehicle = input.vehicleName?.trim()
  const settled = input.money.remainingAmount <= 0

  const lines: string[] = []

  lines.push(customer ? `Namaste ${customer} 🙏` : 'Namaste 🙏')
  lines.push('')
  lines.push(
    vehicle
      ? `Welcome to ${garage}, and thank you for trusting us with your ${vehicle}.`
      : `Welcome to ${garage}, and thank you for choosing us.`,
  )
  lines.push('')
  lines.push(
    'Your service is complete and the vehicle has been checked over before handover. We are grateful for your business.',
  )
  lines.push('')

  lines.push(bold('PAYMENT RECEIPT'))
  lines.push(`Job Card: ${input.jobNumber}`)
  if (input.vehicleNumber?.trim()) lines.push(`Vehicle: ${input.vehicleNumber.trim()}`)
  lines.push(`Date: ${receiptDate(input.paymentDate)}`)
  lines.push('')

  // Three figures and no more: what the job came to, what was handed over
  // just now, and what is left. A list of every receipt ever taken on the
  // card is a statement, not a receipt, and it buried these three.
  lines.push(`Total Amount: ${formatMoney(input.money.totalAmount)}`)
  lines.push(
    `${bold(`Amount Paid Now: ${formatMoney(input.amount)}`)} (${paymentMethodLabel(input.paymentMethod)})`,
  )
  lines.push(bold(`Remaining Amount: ${formatMoney(Math.max(0, input.money.remainingAmount))}`))
  lines.push('')

  lines.push(
    settled
      ? 'Your bill is fully settled — nothing is pending. ✅'
      : `Kindly settle the remaining ${formatMoney(input.money.remainingAmount)} at your convenience.`,
  )
  lines.push('')
  lines.push(
    'Do reply to this message if you have any question about the work done. We look forward to serving you again.',
  )
  lines.push('')
  lines.push(bold(garage))
  if (input.garageMobile?.trim()) lines.push(input.garageMobile.trim())

  return lines.join('\n')
}

/** The `wa.me` link that opens the chat with the message already typed in. */
export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/**
 * Opens the chat in a new tab. Call it straight out of the click that asked
 * for it — a tab opened after an `await` is a pop-up as far as the browser is
 * concerned, and gets blocked.
 */
export function openWhatsapp(link: string): void {
  window.open(link, '_blank', 'noopener,noreferrer')
}
