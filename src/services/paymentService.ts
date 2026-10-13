import { ApiError, apiRequest } from './httpClient'
import type {
  JobCardMoney,
  JobCardPaymentsData,
  PaymentMutationData,
  RecordPaymentPayload,
  UpdatePaymentPayload,
} from '@/types/payment'

/**
 * `GET /api/auth/payment/job-card/:jobCardId` — what the card is worth, what
 * has been collected, what is still to pay, and every live receipt behind those
 * numbers.
 *
 * A card nothing has been paid on is not a 404: it answers with an empty list
 * and a `remainingAmount` equal to its total.
 */
export function getJobCardPayments(jobCardId: string): Promise<JobCardPaymentsData> {
  return apiRequest<JobCardPaymentsData>(
    `/auth/payment/job-card/${encodeURIComponent(jobCardId)}`,
  )
}

/**
 * `POST /api/auth/payment` — one receipt against a job card.
 *
 * The card moves with it: part of the bill leaves it `PARTIAL`, the last of it
 * leaves it `PAID` and — nothing being owed any more — marks the card
 * `DELIVERED` and stamps its completion date.
 *
 * More than the balance is a 400 naming what is actually left; see
 * `paymentBalanceFromError` for reading the money back off it.
 */
export function recordPayment(payload: RecordPaymentPayload): Promise<PaymentMutationData> {
  return apiRequest<PaymentMutationData>('/auth/payment', {
    method: 'POST',
    body: payload,
  })
}

/**
 * `PUT /api/auth/payment/:id` — corrects a receipt and re-settles the card from
 * the new sum. A receipt can always be edited down; an edit that leaves the
 * bill short puts a `DELIVERED` card back to `PENDING`.
 */
export function updatePayment(
  id: string,
  payload: UpdatePaymentPayload,
): Promise<PaymentMutationData> {
  return apiRequest<PaymentMutationData>(`/auth/payment/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/**
 * `DELETE /api/auth/payment/:id` — cancels a receipt. A soft delete, so the
 * card's history still shows that the money was taken and then given back
 * rather than showing nothing. The balance rises by the cancelled amount and
 * the card is re-settled with it.
 */
export function deletePayment(id: string): Promise<PaymentMutationData> {
  return apiRequest<PaymentMutationData>(`/auth/payment/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/**
 * The money block carried by a refusal.
 *
 * "More than the balance", "already fully paid" and "nothing to pay yet" all
 * answer with the same block a success does, so a screen working from a stale
 * total can re-render straight from the error instead of firing another
 * request. Anything else — a network failure, a 401 — carries none, and the
 * screen keeps the numbers it has.
 */
export function paymentBalanceFromError(cause: unknown): JobCardMoney | null {
  if (!(cause instanceof ApiError)) return null

  const payload = cause.payload as { data?: unknown } | null
  const data = payload?.data

  if (!data || typeof data !== 'object') return null

  const money = data as Partial<JobCardMoney>
  return typeof money.remainingAmount === 'number' && typeof money.totalAmount === 'number'
    ? (money as JobCardMoney)
    : null
}

export const paymentService = {
  getJobCardPayments,
  recordPayment,
  updatePayment,
  deletePayment,
}
