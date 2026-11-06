import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { AlertCircle, AlertTriangle, Phone } from 'lucide-react'
import { Button, Input, PasswordInput, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { accessOf } from '@/context/AuthContext'
import { ApiError } from '@/services/httpClient'
import {
  PASSWORD_MAX_LENGTH,
  mobileNumberRules,
  normalizeMobileInput,
  passwordRules,
} from '@/lib/validation'

interface LoginForm {
  mobileNumber: string
  password: string
}

export function Login() {
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: 'onTouched',
    defaultValues: { mobileNumber: '', password: '' },
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  /** Shown in amber rather than red: nothing was typed wrong, a plan is needed. */
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login, logoutReason, logoutMessage, clearLogoutReason } = useAuth()

  // Where the user was headed before the guard bounced them here.
  const routeState = location.state as { from?: string; mobileNumber?: string; fromRegister?: boolean } | null
  const redirectTo = routeState?.from ?? '/app'

  // Sent here by the register screen because the number already has an
  // account: fill it in, the password is all that is left.
  useEffect(() => {
    if (!routeState?.mobileNumber) return
    setValue('mobileNumber', routeState.mobileNumber)
    setFocus('password')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Explain an automatic sign-out instead of silently landing here: the token
  // ran out, or the free trial / plan did (signing in then offers the plans).
  useEffect(() => {
    if (logoutReason === 'expired') {
      setFormError('Your session has expired. Please sign in again.')
      clearLogoutReason()
    } else if (logoutReason === 'subscription') {
      setSubscriptionNotice(
        `${logoutMessage ?? 'Your subscription has ended.'} Sign in to choose a plan.`,
      )
      clearLogoutReason()
    }
  }, [logoutReason, logoutMessage, clearLogoutReason])

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onSubmit = async ({ mobileNumber, password }: LoginForm) => {
    setLoading(true)
    setFormError(null)
    setSubscriptionNotice(null)

    try {
      const session = await login({ mobileNumber: mobileNumber.trim(), password })
      toast(`Welcome back, ${session.user.ownerName}!`, 'success')

      // Signed in either way. No live subscription (expired, cancelled, never
      // bought) opens the renewal / plan page instead of the dashboard.
      if (accessOf(session)?.hasAccess) {
        navigate(redirectTo, { replace: true })
      } else {
        const query = redirectTo.includes('?') ? redirectTo.slice(redirectTo.indexOf('?')) : ''
        navigate(`/plans${query}`, { replace: true })
      }
    } catch (error) {
      // 401 carries the API's deliberately vague "Invalid mobile number or password."
      // 403 ACCOUNT_SUSPENDED / ACCOUNT_DELETION_PENDING carries its own message.
      const message =
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.'
      setFormError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AuthHeader
        title="Sign in to your garage"
        subtitle="Use your registered mobile number and password. No OTP needed to log in."
      />

      {routeState?.fromRegister && !formError && (
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
          <p className="font-medium">Welcome back! This number already has a garage account.</p>
          <p className="mt-0.5 text-xs text-sky-700">
            Your data is safe. If your plan has ended, you can renew it right after you log in.
          </p>
        </div>
      )}

      {subscriptionNotice && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">{subscriptionNotice}</p>
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9876543210"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.mobileNumber?.message}
          {...mobileField}
          onChange={(e) => {
            // Block letters and symbols as the user types (typing and pasting).
            e.target.value = normalizeMobileInput(e.target.value)
            void mobileField.onChange(e)
          }}
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.password?.message}
          {...register('password', passwordRules)}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Login
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        New to GaragePilot?
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Link
        to="/register"
        className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
      >
        Create garage account<span className="hidden sm:inline">&nbsp;— free for 30 days</span>
      </Link>
    </div>
  )
}
