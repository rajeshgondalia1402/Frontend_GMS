/** Types mirroring the Node.js API contract for `/api/auth/payment`. */

import type { JobCardStatus, JobPaymentStatus } from './jobCard'

/**
 * How the money was taken. The API reads these case-insensitively and turns
 * spaces, hyphens and slashes into underscores, but the canonical value is what
 * is sent — there is no reason to make it guess.
 */
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT_DUE'

/** One receipt as the API hands it back. */
export interface PaymentRecord {
  id: string
  serviceJobId: string
  /** When the money was taken — stamped by the API, never sent. */
  paymentDate: string
  amount: number
  paymentMethod: PaymentMethod
  /** The logged-in garage, read from the token. */
  receivedBy: string
  note: string | null
  createdAt: string
  updatedAt: string
}

/**
 * What the card is worth and what is left on it. Every payment endpoint returns
 * this block — including the 400 raised when more than the balance is offered —
 * so a screen can always re-render the money straight from the answer.
 */
export interface JobCardMoney {
  id: string
  jobNumber: string
  status: JobCardStatus
  paymentStatus: JobPaymentStatus
  totalAmount: number
  paidAmount: number
  /** What is still to pay, floored at 0. The number read out to the customer. */
  remainingAmount: number
  completionDate: string | null
}

/**
 * `POST /api/auth/payment`.
 *
 * `paymentDate`, `receivedBy` and both of the card's statuses are the API's to
 * set: the receipt is stamped as it is taken, the garage comes from the token,
 * and the card moves to PARTIAL / PAID — and to DELIVERED once nothing is left
 * to pay — off the payments themselves.
 */
export interface RecordPaymentPayload {
  serviceJobId: string
  /** More than 0, at most 2 decimals, never more than the balance. */
  amount: number
  paymentMethod: PaymentMethod
  /** Free text on the receipt, max 250. Empty is stored as `null`. */
  note?: string | null
}

/**
 * `PUT /api/auth/payment/:id` — correcting a receipt that was entered wrong.
 * Partial, but never empty. The card is re-settled from the new sum, so an edit
 * that leaves the bill short puts a DELIVERED card back to PENDING.
 */
export interface UpdatePaymentPayload {
  amount?: number
  paymentMethod?: PaymentMethod
  /** `null` clears the note; omitting the key leaves it alone. */
  note?: string | null
}

/** What recording, correcting or cancelling a receipt answers with. */
export interface PaymentMutationData {
  payment: PaymentRecord
  jobCard: JobCardMoney
}

/** `GET /api/auth/payment/job-card/:jobCardId` — the card's money and history. */
export interface JobCardPaymentsData {
  jobCard: JobCardMoney
  /** Live receipts only — a cancelled one is left out. */
  payments: PaymentRecord[]
}
