import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, CreditCard, History, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { PlanCheckoutPanel, planTitle } from '@/components/auth/PlanCheckoutPanel'
import { Badge, ErrorState, LoadingState, useToast } from '@/components/ui'
import type { Tone } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { subscriptionService } from '@/services/subscriptionService'
import { ApiError } from '@/services/httpClient'
import { formatDayCount, formatSubscriptionDate, getSubscriptionView } from '@/lib/subscription'
import { formatCurrency } from '@/lib/utils'
import type { SubscriptionHistoryItem, SubscriptionPayment, VerifyPaymentData } from '@/types/subscription'

const PERIOD_TONE: Record<string, Tone> = {
  ACTIVE: 'success',
  SCHEDULED: 'info',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
}

const PAYMENT_TONE: Record<string, Tone> = {
  SUCCESS: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  REFUNDED: 'neutral',
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')
}

/**
 * `/app/subscription` — billing for a garage that has access: the plan running
 * now, renewals already bought, renew early / change plan, and the history of
 * every period and payment. (A garage without access gets `/plans` instead.)
 */
export function Subscription() {
  const { access, applyAccess } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([])
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [current, periods, paid] = await Promise.all([
        subscriptionService.getCurrent(),
        subscriptionService.getHistory(),
        subscriptionService.getPayments(),
      ])
      applyAccess({
        hasAccess: current.hasAccess,
        status: current.status,
        message: current.message,
        isFreeTrial: current.isFreeTrial,
        subscription: current.subscription,
        upcoming: current.upcoming ?? [],
        freeTrialUsed: current.freeTrialUsed,
      })
      setHistory(periods)
      setPayments(paid)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your subscription.')
    } finally {
      setLoading(false)
    }
  }, [applyAccess])

  useEffect(() => {
    void load()
  }, [load])

  const current = access?.subscription ?? null
  const upcoming = access?.upcoming ?? []
  const view = getSubscriptionView(current)
  // A purchase now starts after everything already paid for.
  const runningUntil = upcoming.length > 0 ? upcoming[upcoming.length - 1].endDate : (current?.endDate ?? null)
  const lastPlan = upcoming.length > 0 ? upcoming[upcoming.length - 1] : current

  const handlePaid = (result: VerifyPaymentData) => {
    applyAccess(result.access)
    const startsLater = result.subscription?.status === 'SCHEDULED'
    toast(
      startsLater
        ? `Payment confirmed. Your new plan starts on ${formatSubscriptionDate(result.subscription?.startDate)}.`
        : 'Payment confirmed. Your subscription is active.',
      'success',
    )
    void load()
  }

  return (
    <div>
      <PageHeader title="Subscription & Billing" subtitle="Your plan, renewals and payment history." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-primary-600" /> Current plan
            </div>
            {current ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-bold text-slate-900">{view.planLabel}</span>
                  <Badge tone={PERIOD_TONE[current.status] ?? 'neutral'}>{statusLabel(current.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {view.startDateLabel} – {view.endDateLabel}
                </p>
                {access?.hasAccess && (
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatDayCount(view.daysRemaining)} remaining
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">No subscription yet.</p>
            )}

            {upcoming.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                {upcoming.map((period) => (
                  <div key={period.id ?? period.startDate} className="flex items-start gap-2 text-sm text-sky-800">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    <span>
                      <span className="font-semibold">{planTitle(period.plan)}</span> starts{' '}
                      {formatSubscriptionDate(period.startDate)}, ends {formatSubscriptionDate(period.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-3 text-sm font-semibold text-slate-900">Renew or change plan</div>
            <PlanCheckoutPanel
              currentPlanId={lastPlan?.plan === 'FREE_TRIAL' ? null : (lastPlan?.planID ?? null)}
              runningUntil={runningUntil}
              preselect={searchParams.get('plan')}
              onPaid={handlePaid}
            />
          </section>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState title="Could not load billing" description={error} onRetry={() => void load()} />
          ) : (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <History className="h-4 w-4 text-primary-600" /> Subscription history
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">No subscription periods yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {history.map((period) => (
                      <li key={period.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                        <span>
                          <span className="font-medium text-slate-900">{planTitle(period.plan)}</span>
                          <span className="block text-xs text-slate-500">
                            {formatSubscriptionDate(period.startDate)} – {formatSubscriptionDate(period.endDate)}
                          </span>
                        </span>
                        <Badge tone={PERIOD_TONE[period.status] ?? 'neutral'}>{statusLabel(period.status)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CreditCard className="h-4 w-4 text-primary-600" /> Payments
                </div>
                {payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No online payments yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {payments.map((payment) => (
                      <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="font-medium text-slate-900">
                            {payment.plan ? planTitle(payment.plan) : 'Plan'} · {formatCurrency(payment.amount)}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {formatSubscriptionDate(payment.paymentDate ?? payment.createdAt)}
                            {payment.paymentId ? ` · ${payment.paymentId}` : ''}
                            {payment.status === 'FAILED' && payment.failureReason ? ` · ${payment.failureReason}` : ''}
                          </span>
                        </span>
                        <Badge tone={PAYMENT_TONE[payment.status] ?? 'neutral'}>{statusLabel(payment.status)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
