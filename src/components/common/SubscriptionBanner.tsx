import { useNavigate } from 'react-router-dom'
import { Sparkles, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatDayCount } from '@/lib/subscription'
import type { SubscriptionView } from '@/lib/subscription'
import { cn } from '@/lib/utils'

interface SubscriptionBannerProps {
  view: SubscriptionView
}

export function SubscriptionBanner({ view }: SubscriptionBannerProps) {
  const navigate = useNavigate()
  const go = () => navigate('/app/subscription')

  const { status, daysRemaining, totalDays, daysUsed, progress, planLabel, endDateLabel } = view

  if (status === 'expired') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              Your {planLabel} has expired.
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {endDateLabel
                ? `It ended on ${endDateLabel}. Renew your plan to continue using Garage Management.`
                : 'Renew your plan to continue using Garage Management.'}
            </p>
            <Button size="sm" variant="danger" className="mt-3" onClick={go}>
              Renew Subscription
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'expiring') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800">
              Your {planLabel} expires in {formatDayCount(daysRemaining)}.
            </p>
            {endDateLabel && (
              <p className="mt-0.5 text-sm text-amber-600">Ends on {endDateLabel}</p>
            )}
          </div>
          <Button size="sm" className="shrink-0" onClick={go}>
            Renew Now
          </Button>
        </div>
      </div>
    )
  }

  // trial / active
  const isTrial = status === 'trial'
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isTrial ? 'border-sky-200 bg-sky-50' : 'border-emerald-200 bg-emerald-50',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles className={cn('h-5 w-5 shrink-0', isTrial ? 'text-sky-500' : 'text-emerald-500')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', isTrial ? 'text-sky-800' : 'text-emerald-800')}>
            {planLabel}
          </p>
          <p className={cn('text-sm', isTrial ? 'text-sky-600' : 'text-emerald-600')}>
            {formatDayCount(daysRemaining)} remaining
            {endDateLabel && ` · ends ${endDateLabel}`}
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 bg-white" onClick={go}>
          View Plans
        </Button>
      </div>

      {/* Elapsed share of the plan, from startDate -> endDate */}
      {totalDays > 0 && (
        <div className="mt-3">
          <div
            className={cn('h-1.5 w-full overflow-hidden rounded-full', isTrial ? 'bg-sky-100' : 'bg-emerald-100')}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalDays}
            aria-valuenow={daysUsed}
            aria-label={`${daysUsed} of ${totalDays} days used`}
          >
            <div
              className={cn('h-full rounded-full transition-all', isTrial ? 'bg-sky-500' : 'bg-emerald-500')}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className={cn('mt-1.5 text-xs', isTrial ? 'text-sky-600/80' : 'text-emerald-600/80')}>
            Day {Math.min(daysUsed + 1, totalDays)} of {totalDays}
          </p>
        </div>
      )}
    </div>
  )
}
