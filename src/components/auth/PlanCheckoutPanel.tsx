import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, Lock, Package } from 'lucide-react'
import { Button, ErrorState, LoadingState } from '@/components/ui'
import { subscriptionService } from '@/services/subscriptionService'
import { ApiError } from '@/services/httpClient'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { formatSubscriptionDate } from '@/lib/subscription'
import { cn, formatCurrency } from '@/lib/utils'
import type { RenewalPlan } from '@/types/auth'
import type { CheckoutIntent, VerifyPaymentData, VerifyPaymentPayload } from '@/types/subscription'

/** `HALF_YEARLY` → `Half Yearly`. */
export function planTitle(name: string): string {
  return name
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** `365` → `1 year`, `30` → `1 month`, `45` → `45 days`. */
export function durationLabel(days: number): string {
  if (days % 365 === 0) return days === 365 ? '1 year' : `${days / 365} years`
  if (days % 30 === 0) return days === 30 ? '1 month' : `${days / 30} months`
  return days === 1 ? '1 day' : `${days} days`
}

/** How long to keep asking while Razorpay has the money but has not captured it. */
const PENDING_RETRIES = 4
const PENDING_RETRY_MS = 3000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface PlanCheckoutPanelProps {
  /** The plan running now (or last run), to tell renew from change-plan. */
  currentPlanId?: number | null
  /** End of the period running now, when it is still running. A purchase starts then. */
  runningUntil?: string | null
  /** A plan name to preselect, e.g. `MONTHLY` from the website's `?plan=monthly`. */
  preselect?: string | null
  /** Called once the SERVER has confirmed the payment and activated the period. */
  onPaid: (result: VerifyPaymentData) => void
}

type Phase = 'idle' | 'ordering' | 'paying' | 'verifying'

/**
 * Plan picker + Razorpay checkout, shared by the renewal page (no access) and
 * the billing screen (renew early / change plan).
 *
 * Only the plan id goes to the API; the price comes from the server. A payment
 * counts only once POST /api/payment/verify says SUCCESS — what the Razorpay
 * window reports in the browser is never enough on its own.
 */
export function PlanCheckoutPanel({ currentPlanId, runningUntil, preselect, onPaid }: PlanCheckoutPanelProps) {
  const [plans, setPlans] = useState<RenewalPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const list = await subscriptionService.getPlans()
      setPlans(list)
      const wanted = preselect ? list.find((plan) => plan.name === preselect.toUpperCase()) : undefined
      const current = list.find((plan) => plan.planId === currentPlanId)
      setSelected((existing) => existing ?? wanted?.planId ?? current?.planId ?? list[0]?.planId ?? null)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load the subscription plans.')
    } finally {
      setLoading(false)
    }
  }, [preselect, currentPlanId])

  useEffect(() => {
    void load()
  }, [load])

  /** Asks the server, retrying a little while the payment is still PENDING. */
  const confirm = async (payload: VerifyPaymentPayload): Promise<VerifyPaymentData> => {
    let result = await subscriptionService.verifyPayment(payload)
    for (let i = 0; i < PENDING_RETRIES && result.payment.status === 'PENDING'; i += 1) {
      await wait(PENDING_RETRY_MS)
      result = await subscriptionService.verifyPayment({ orderId: payload.orderId })
    }
    return result
  }

  const pay = async () => {
    if (selected === null) return
    setError(null)
    setNotice(null)

    const intent: CheckoutIntent =
      currentPlanId == null ? 'checkout' : currentPlanId === selected ? 'renew' : 'change-plan'

    try {
      setPhase('ordering')
      const order = await subscriptionService.createCheckout(intent, selected)

      setPhase('paying')
      const outcome = await openRazorpayCheckout(order.checkout)

      setPhase('verifying')
      const result =
        outcome.kind === 'success'
          ? await confirm({
              orderId: outcome.response.razorpay_order_id,
              paymentId: outcome.response.razorpay_payment_id,
              signature: outcome.response.razorpay_signature,
            })
          : // Closed the window: it may still have gone through (e.g. UPI approved late).
            await subscriptionService.verifyPayment({ orderId: order.checkout.orderId })

      if (result.payment.status === 'SUCCESS') {
        onPaid(result)
        return
      }

      if (result.payment.status === 'PENDING') {
        setNotice(
          outcome.kind === 'success'
            ? 'Your payment is being confirmed by the bank. Your plan will be activated automatically within a few minutes.'
            : (outcome.lastError ?? 'Payment was not completed. You have not been charged.'),
        )
      } else {
        const lastError = outcome.kind === 'dismissed' ? outcome.lastError : null
        setError(result.payment.failureReason ?? lastError ?? 'Payment failed. Please try again.')
      }
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not start the payment. Please try again.',
      )
    } finally {
      setPhase('idle')
    }
  }

  const chosen = plans.find((plan) => plan.planId === selected)
  const busy = phase !== 'idle'
  const startsLater = runningUntil && Date.parse(runningUntil) > Date.now()

  const buttonLabel =
    phase === 'ordering'
      ? 'Creating order…'
      : phase === 'paying'
        ? 'Waiting for payment…'
        : phase === 'verifying'
          ? 'Confirming payment…'
          : chosen
            ? `Pay ${formatCurrency(chosen.price)} for ${planTitle(chosen.name)}`
            : 'Pay & Subscribe'

  return (
    <div>
      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState title="Could not load plans" description={loadError} onRetry={() => void load()} />
      ) : plans.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          No subscription plans are on offer right now. Please contact support.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Subscription plans" className="space-y-2.5">
          {plans.map((plan) => {
            const active = plan.planId === selected
            const isCurrent = plan.planId === currentPlanId
            return (
              <button
                key={plan.planId}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => setSelected(plan.planId)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                  active
                    ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-100'
                    : 'border-slate-200 bg-white hover:border-primary-200',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600',
                  )}
                >
                  <Package className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{planTitle(plan.name)}</span>
                  <span className="block text-xs text-slate-500">
                    {durationLabel(plan.durationDays)}
                    {isCurrent && <span className="font-medium text-primary-600"> · Current</span>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                  <span className="block text-xs text-slate-500">/ {durationLabel(plan.durationDays)}</span>
                </span>
                {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600" />}
              </button>
            )
          })}
        </div>
      )}

      {startsLater && chosen && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Your current plan stays active. The new {planTitle(chosen.name)} plan starts on{' '}
          {formatSubscriptionDate(runningUntil)}, when the current one ends.
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <Button
        className="mt-5"
        fullWidth
        size="lg"
        loading={busy}
        disabled={selected === null || loading || Boolean(loadError)}
        leftIcon={busy ? undefined : <Lock className="h-4 w-4" />}
        onClick={() => void pay()}
      >
        {buttonLabel}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">Secure payment by Razorpay. Your plan starts only after the payment is confirmed.</p>
    </div>
  )
}
