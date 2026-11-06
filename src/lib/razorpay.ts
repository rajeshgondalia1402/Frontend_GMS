import type { RazorpayCheckoutOptions, RazorpaySuccess } from '@/types/subscription'

/**
 * Razorpay Checkout, loaded on demand. The card / UPI details are typed into
 * Razorpay's own frame — this app never sees them.
 */
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

let loading: Promise<RazorpayConstructor> | null = null

function loadCheckout(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (loading) return loading

  loading = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay did not load.'))
    }
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Could not load the payment window. Please check your connection and try again.'))
    }
    document.body.appendChild(script)
  })

  return loading
}

/** How the checkout window ended. */
export type CheckoutOutcome =
  | { kind: 'success'; response: RazorpaySuccess }
  | { kind: 'dismissed'; lastError: string | null }

/**
 * Opens Razorpay Checkout and resolves once it closes. A failed attempt does
 * NOT close the window (Razorpay lets the customer retry), so failures are only
 * remembered and reported if the customer then gives up.
 *
 * "success" here is only what the browser saw — the caller must still have the
 * server verify the payment before treating it as paid.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<CheckoutOutcome> {
  const Razorpay = await loadCheckout()

  return new Promise<CheckoutOutcome>((resolve) => {
    let lastError: string | null = null

    const instance = new Razorpay({
      key: options.keyId,
      order_id: options.orderId,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      prefill: options.prefill,
      theme: { color: '#2563eb' },
      handler: (response: RazorpaySuccess) => resolve({ kind: 'success', response }),
      modal: {
        ondismiss: () => resolve({ kind: 'dismissed', lastError }),
      },
    })

    instance.on('payment.failed', (response) => {
      lastError = response.error?.description ?? 'Payment failed.'
    })

    instance.open()
  })
}
