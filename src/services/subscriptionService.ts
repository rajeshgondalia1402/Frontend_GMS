import { apiRequest } from './httpClient'
import type { RenewalPlan } from '@/types/auth'
import type {
  CheckoutData,
  CheckoutIntent,
  CurrentSubscriptionData,
  SubscriptionHistoryItem,
  SubscriptionPayment,
  VerifyPaymentData,
  VerifyPaymentPayload,
} from '@/types/subscription'

/**
 * Billing for the signed-in garage. Every call except `getPlans` takes the
 * garage token, and keeps working after the plan has ended — that is how an
 * expired garage pays to get back in.
 */

/** `GET /api/subscription/plans` — public; paid plans on offer, never the free trial. */
export async function getPlans(): Promise<RenewalPlan[]> {
  const data = await apiRequest<{ plans: RenewalPlan[] }>('/subscription/plans', { auth: false })
  return data.plans ?? []
}

/** `GET /api/subscription/current` — access state, current and upcoming periods. */
export function getCurrent(): Promise<CurrentSubscriptionData> {
  return apiRequest<CurrentSubscriptionData>('/subscription/current')
}

/** `GET /api/subscription/history` — every period, newest first. */
export async function getHistory(): Promise<SubscriptionHistoryItem[]> {
  const data = await apiRequest<{ subscriptions: SubscriptionHistoryItem[] }>('/subscription/history')
  return data.subscriptions ?? []
}

/** `GET /api/subscription/payments` — every Razorpay checkout, newest first. */
export async function getPayments(): Promise<SubscriptionPayment[]> {
  const data = await apiRequest<{ payments: SubscriptionPayment[] }>('/subscription/payments')
  return data.payments ?? []
}

/**
 * Opens a Razorpay order for `planId`. Only the plan id is sent — the price
 * comes from the server. Nothing is activated until `verifyPayment`.
 */
export function createCheckout(intent: CheckoutIntent, planId: number): Promise<CheckoutData> {
  return apiRequest<CheckoutData>(`/subscription/${intent}`, {
    method: 'POST',
    body: { planId },
  })
}

/**
 * `POST /api/payment/verify` — the server confirms the payment with Razorpay
 * and only then activates the period. Safe to call more than once.
 */
export function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentData> {
  return apiRequest<VerifyPaymentData>('/payment/verify', {
    method: 'POST',
    body: payload,
  })
}

export const subscriptionService = {
  getPlans,
  getCurrent,
  getHistory,
  getPayments,
  createCheckout,
  verifyPayment,
}
