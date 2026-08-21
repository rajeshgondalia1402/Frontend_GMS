import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, KeyRound, Phone } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/httpClient'
import { savePendingReset } from '@/lib/pendingPasswordReset'
import { mobileNumberRules, normalizeMobileInput } from '@/lib/validation'

interface ForgotForm {
  mobileNumber: string
}

export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotForm>({ mode: 'onTouched', defaultValues: { mobileNumber: '' } })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()

  // The reset screen sends the user back here when the number turns out not to
  // be registered, or the parked entry went stale.
  const state = location.state as { message?: string; mobileNumber?: string } | null

  useEffect(() => {
    if (!state?.message && !state?.mobileNumber) return

    if (state.message) setError(state.message)
    if (state.mobileNumber) setValue('mobileNumber', state.mobileNumber)
    navigate(location.pathname, { replace: true, state: null })
  }, [state, setValue, navigate, location.pathname])

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onSubmit = async ({ mobileNumber }: ForgotForm) => {
    const mobile = mobileNumber.trim()

    setLoading(true)
    setError(null)

    try {
      await authService.forgotPassword(mobile)
      // Remember when the code went out so the reset screen's cooldown and
      // validity timers are correct even after a refresh.
      savePendingReset(mobile)
      navigate('/reset-password')
    } catch (err) {
      // 404 means the number is not registered — the API says so plainly here,
      // unlike login, because you must already have an account to reset one.
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Forgot Password?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your registered mobile number and we'll send you a verification code.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
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
            e.target.value = normalizeMobileInput(e.target.value)
            void mobileField.onChange(e)
          }}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Send OTP
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
