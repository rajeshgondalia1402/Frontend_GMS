import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, LogOut } from 'lucide-react'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { PlanCheckoutPanel } from '@/components/auth/PlanCheckoutPanel'
import { Button, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import type { VerifyPaymentData } from '@/types/subscription'

/**
 * `/plans` — a signed-in garage with no live subscription lands here after
 * login (or the moment its plan runs out). The account and all its data are
 * untouched; paying for a plan opens the dashboard again. No registration and
 * no OTP are needed again.
 */
export function ChoosePlan() {
  const { user, access, applyAccess, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const neverSubscribed = access?.status === 'NO_SUBSCRIPTION'
  const title = neverSubscribed ? 'Choose a Plan' : 'Renew Your Subscription'
  const message =
    access?.message ??
    (neverSubscribed
      ? 'Choose a subscription plan to start using your garage account.'
      : 'Your subscription has ended. Please renew to continue.')

  const handlePaid = (result: VerifyPaymentData) => {
    if (result.access.hasAccess) {
      toast('Payment confirmed. Your subscription is active.', 'success')
      navigate('/app', { replace: true })
    }
    applyAccess(result.access)
  }

  return (
    <div>
      <AuthHeader
        title={title}
        subtitle={user ? `${user.garageName} · +91 ${user.mobileNumber}` : 'Your garage account'}
      />

      <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">{message}</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Your customers, vehicles and job cards are safe and will be there when you renew.
          </p>
        </div>
      </div>

      <PlanCheckoutPanel
        currentPlanId={neverSubscribed ? null : (access?.subscription?.planID ?? null)}
        preselect={searchParams.get('plan')}
        onPaid={handlePaid}
      />

      <Button
        className="mt-3"
        fullWidth
        variant="outline"
        leftIcon={<LogOut className="h-4 w-4" />}
        onClick={() => logout('manual')}
      >
        Sign out
      </Button>
    </div>
  )
}
