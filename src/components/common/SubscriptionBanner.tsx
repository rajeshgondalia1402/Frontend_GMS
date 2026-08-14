import { useNavigate } from 'react-router-dom'
import { Sparkles, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import type { SubscriptionStatus } from '@/types'
import { cn } from '@/lib/utils'

interface SubscriptionBannerProps {
  status: SubscriptionStatus
  daysRemaining?: number
}

export function SubscriptionBanner({ status, daysRemaining = 23 }: SubscriptionBannerProps) {
  const navigate = useNavigate()
  const go = () => navigate('/app/subscription')

  if (status === 'expired') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">Your subscription has expired.</p>
            <p className="mt-0.5 text-sm text-red-600">
              Renew your plan to continue using Garage Management.
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
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800">
              Your trial expires in {daysRemaining} days.
            </p>
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
      <div className="flex items-center gap-3">
        <Sparkles className={cn('h-5 w-5 shrink-0', isTrial ? 'text-sky-500' : 'text-emerald-500')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', isTrial ? 'text-sky-800' : 'text-emerald-800')}>
            {isTrial ? 'Free Trial' : 'Active Plan'}
          </p>
          <p className={cn('text-sm', isTrial ? 'text-sky-600' : 'text-emerald-600')}>
            {isTrial ? `${daysRemaining} days remaining` : 'Monthly plan · renews 12 Sep 2026'}
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 bg-white" onClick={go}>
          View Plans
        </Button>
      </div>
    </div>
  )
}
