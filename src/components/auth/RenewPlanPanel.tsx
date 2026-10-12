import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import { Button, ErrorState, LoadingState } from '@/components/ui'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/httpClient'
import { cn, formatCurrency } from '@/lib/utils'
import type { RenewalPlan } from '@/types/auth'

/** `HALF_YEARLY` → `Half Yearly`. */
function planTitle(name: string): string {
  return name
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** `365` → `1 year`, `30` → `1 month`, `45` → `45 days`. */
function durationLabel(days: number): string {
  if (days % 365 === 0) return days === 365 ? '1 year' : `${days / 365} years`
  if (days % 30 === 0) return days === 30 ? '1 month' : `${days / 30} months`
  return days === 1 ? '1 day' : `${days} days`
}

interface RenewPlanPanelProps {
  /** Why login was refused — the API's words, e.g. "Your free trial has ended...". */
  message: string
  /** Starts the chosen plan and signs in; rejects with the API's error. */
  onRenew: (planId: number) => Promise<void>
  /** Back to the login form, e.g. to sign in with another number. */
  onBack: () => void
}

/**
 * Shown in place of the login form when the password was right but the free
 * trial or plan has ended. The garage picks a paid plan — the free trial is
 * never offered again — and is signed straight in.
 */
export function RenewPlanPanel({ message, onRenew, onBack }: RenewPlanPanelProps) {
  const [plans, setPlans] = useState<RenewalPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [renewError, setRenewError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const list = await authService.getRenewalPlans()
      setPlans(list)
      setSelected((current) => current ?? list[0]?.planId ?? null)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Could not load the subscription plans.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async () => {
    if (selected === null) return
    setSubmitting(true)
    setRenewError(null)
    try {
      await onRenew(selected)
    } catch (error) {
      setRenewError(error instanceof ApiError ? error.message : 'Could not activate the plan. Please try again.')
      setSubmitting(false)
    }
  }

  const chosen = plans.find((plan) => plan.planId === selected)

  return (
    <div>
      <div className="mb-5 text-center">
        <h1 className="text-lg font-bold text-slate-900">Subscription Required</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a plan to continue using your garage account</p>
      </div>

      <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">{message}</p>
          <p className="mt-0.5 text-xs text-amber-700">
            The free trial can be used only once per mobile number.
          </p>
        </div>
      </div>

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
            return (
              <button
                key={plan.planId}
                type="button"
                role="radio"
                aria-checked={active}
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
                  <span className="block font-semibold text-slate-900">{planTitle(plan.name)}</span>
                  <span className="block text-xs text-slate-500">{durationLabel(plan.durationDays)}</span>
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

      {renewError && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {renewError}
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        <Button
          fullWidth
          size="lg"
          loading={submitting}
          disabled={selected === null || loading || Boolean(loadError)}
          onClick={() => void submit()}
        >
          {chosen ? `Subscribe to ${planTitle(chosen.name)} & Login` : 'Subscribe & Login'}
        </Button>
        <Button
          fullWidth
          variant="outline"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
          disabled={submitting}
        >
          Back to Login
        </Button>
      </div>
    </div>
  )
}
