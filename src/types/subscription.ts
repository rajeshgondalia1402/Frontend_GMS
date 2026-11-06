import type { AuthAccess, AuthSubscription } from './auth'

/** Which endpoint opens the checkout. The API works out the purpose itself. */
export type CheckoutIntent = 'checkout' | 'renew' | 'change-plan'

export type SubscriptionPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

/** One row of `subscription_payments` — a Razorpay checkout of a plan. */
export interface SubscriptionPayment {
  id: string
  planId: number
  plan: string | null
  /** NEW | RENEWAL | PLAN_CHANGE */
  purpose: string
  gateway: string
  orderId: string
  paymentId: string | null
  amount: number
  currency: string
  status: SubscriptionPaymentStatus
  failureReason: string | null
  paymentDate: string | null
  subscriptionId: string | null
  createdAt: string
}

/** `GET /api/subscription/current` */
export interface CurrentSubscriptionData extends AuthAccess {
  pendingPayment: SubscriptionPayment | null
}

/** One period of `GET /api/subscription/history`. */
export interface SubscriptionHistoryItem extends AuthSubscription {
  createdAt: string
  payment: SubscriptionPayment | null
}

/** What Razorpay Checkout needs, as the API built it (amount in paise). */
export interface RazorpayCheckoutOptions {
  keyId: string
  orderId: string
  amount: number
  currency: string
  name: string
  description: string
  prefill: { name?: string; contact?: string; email?: string }
}

/** `POST /api/subscription/checkout | renew | change-plan` */
export interface CheckoutData {
  payment: SubscriptionPayment
  checkout: RazorpayCheckoutOptions
  plan: { planId: number; name: string; price: number; durationDays: number; currency: string }
  purpose: string
  /** When the period will start if paid now; later than now for an early renewal. */
  startsAt: string
  startsImmediately: boolean
}

/** What Razorpay Checkout hands the browser on success. */
export interface RazorpaySuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface VerifyPaymentPayload {
  orderId: string
  paymentId?: string
  signature?: string
}

/** `POST /api/payment/verify` */
export interface VerifyPaymentData {
  payment: SubscriptionPayment
  subscription: AuthSubscription | null
  access: AuthAccess
}
