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

/** What the free trial reminder says, from one row of the expiring trials list. */
export interface TrialReminderMessageInput {
  ownerName?: string | null
  garageName?: string | null
  /** When the trial ends, as the API returns it. */
  endDate: string
  /** Whole days still to run; 1 or more for a trial that is still live. */
  daysLeft: number
}

/**
 * The platform admin's reminder to a garage whose free trial is about to end:
 * when it ends, what they keep by subscribing, the plans on offer, and how to
 * go ahead. No prices — those live on the plans and change; the reply is where
 * the conversation about them starts.
 *
 * Handed over prefilled for the admin to read and send, like the receipt.
 */
export function trialReminderMessage(input: TrialReminderMessageInput): string {
  const owner = input.ownerName?.trim()
  const garage = input.garageName?.trim() || 'your garage'
  const ends = receiptDate(input.endDate)
  const left = input.daysLeft <= 1 ? 'less than a day' : `${input.daysLeft} days`

  const lines: string[] = []

  lines.push(owner ? `Namaste ${owner} 🙏` : 'Namaste 🙏')
  lines.push('')
  lines.push(`Greetings from ${bold('GaragePro')}! Thank you for trying GaragePro at ${bold(garage)}.`)
  lines.push('')
  lines.push(
    `This is a gentle reminder that your ${bold('free trial ends on ' + ends)} — only ${left} to go.`,
  )
  lines.push('')
  lines.push(
    'To keep using GaragePro without any interruption, please choose a subscription plan before the trial ends. Everything you have set up stays exactly as it is:',
  )
  lines.push('✅ Customers, vehicles and job cards')
  lines.push('✅ Billing, payments and WhatsApp receipts')
  lines.push('✅ Staff, reports and your complete history')
  lines.push('')
  lines.push(bold('Plans available'))
  lines.push('• Monthly — pay as you go')
  lines.push('• Yearly — best value, save more')
  lines.push('')
  lines.push(
    'Simply reply to this message with the plan you prefer, and our team will share the details and activate it for you.',
  )
  lines.push('')
  lines.push('Thank you for being part of GaragePro. We look forward to supporting your garage.')
  lines.push('')
  lines.push('Warm regards,')
  lines.push(bold('Team GaragePro'))

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
