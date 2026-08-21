import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, Loader2, Pencil, ShieldCheck } from 'lucide-react'
import { Button, OtpInput, PasswordInput, useToast } from '@/components/ui'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/httpClient'
import { clearPendingReset, loadPendingReset, savePendingReset } from '@/lib/pendingPasswordReset'
import { useCountdown } from '@/hooks/useCountdown'
import {
  OTP_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  confirmPasswordRules,
  passwordRules,
  validateOtp,
} from '@/lib/validation'
import { formatClock } from '@/lib/utils'

/** Seconds before "Send OTP again" becomes available. */
const RESEND_COOLDOWN_SECONDS = 60
/** The API keeps a code valid for 10 minutes. */
const OTP_VALIDITY_SECONDS = 10 * 60

interface ResetForm {
  newPassword: string
  confirmPassword: string
}

/** Messages that mean the typed code is unusable, so the boxes are cleared. */
function isOtpProblem(message: string): boolean {
  return /otp/i.test(message)
}

export function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Read once — the entry is cleared on success and re-reading mid-redirect
  // would blank the screen.
  const [pending] = useState(() => loadPendingReset())

  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [otpError, setOtpError] = useState(false)

  const elapsed = pending ? Math.floor((Date.now() - pending.sentAt) / 1000) : 0
  const { seconds: resendIn, start: startResend } = useCountdown(Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed))
  const { seconds: validityLeft, start: startValidity } = useCountdown(Math.max(0, OTP_VALIDITY_SECONDS - elapsed))

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetForm>({
    mode: 'onTouched',
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const mobileNumber = pending?.mobileNumber ?? ''
  const busy = saving || sendingOtp

  // The code is sent by the forgot-password screen, so landing here without a
  // parked entry means the user skipped that step (or it went stale).
  useEffect(() => {
    if (!pending) navigate('/forgot-password', { replace: true })
  }, [pending, navigate])

  /** Sends the user back to step 1, optionally explaining why. */
  const backToStart = useCallback(
    (message?: string) => {
      clearPendingReset()
      navigate('/forgot-password', { state: { message, mobileNumber } })
    },
    [navigate, mobileNumber],
  )

  /** "Send OTP again" — the same endpoint as step 1; the new code replaces the old. */
  const resendOtp = useCallback(async () => {
    setSendingOtp(true)
    setError(null)
    setNotice(null)
    setOtpError(false)

    try {
      await authService.forgotPassword(mobileNumber)
      savePendingReset(mobileNumber)
      setCode('')
      startResend(RESEND_COOLDOWN_SECONDS)
      startValidity(OTP_VALIDITY_SECONDS)
      setNotice('A new code has been sent to your mobile number.')
      toast('A new code has been sent', 'info')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        backToStart(err.message)
        return
      }
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }, [mobileNumber, startResend, startValidity, toast, backToStart])

  const onSubmit = async ({ newPassword }: ResetForm) => {
    const invalidOtp = validateOtp(code)
    if (invalidOtp) {
      setError(invalidOtp)
      setOtpError(true)
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)
    setOtpError(false)

    try {
      await authService.resetPassword({ mobileNumber, otp: code, newPassword })

      clearPendingReset()
      toast('Password reset successfully. Please login with your new password.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError('Something went wrong. Please try again.')
        return
      }
      // 404: the number is not registered, which only step 1 can fix.
      if (err.status === 404) {
        backToStart(err.message)
        return
      }

      setError(err.message)
      // Invalid / expired / already-used codes are worth retyping; a rejected
      // password is not, so the boxes are only cleared for OTP problems.
      if (isOtpProblem(err.message)) {
        setOtpError(true)
        setCode('')
      }
    }
  }

  if (!pending) return null

  const codeExpired = validityLeft <= 0 && !sendingOtp

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Create New Password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the {OTP_LENGTH}-digit code we sent to
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">+91 {mobileNumber}</span>
          <Link
            to="/forgot-password"
            aria-label="Change mobile number"
            className="text-slate-400 transition-colors hover:text-primary-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {!error && notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-700">{notice}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Verification Code</span>
          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next)
              if (otpError) setOtpError(false)
              if (error) setError(null)
            }}
            length={OTP_LENGTH}
            error={otpError}
            disabled={busy}
            autoFocus
          />
          <div className="mt-2.5 flex min-h-5 items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">
              {codeExpired ? 'Code expired' : `Expires in ${formatClock(validityLeft)}`}
            </span>
            {sendingOtp ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Sending...
              </span>
            ) : resendIn > 0 ? (
              <span className="text-slate-500">
                Send again in <span className="font-semibold text-slate-700">{formatClock(resendIn)}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void resendOtp()}
                disabled={busy}
                className="font-semibold text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-50"
              >
                Send OTP again
              </button>
            )}
          </div>
        </div>

        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          hint={`${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`}
          error={errors.newPassword?.message}
          {...register('newPassword', passwordRules)}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', confirmPasswordRules(() => getValues('newPassword')))}
        />

        <Button type="submit" fullWidth size="lg" loading={saving} disabled={sendingOtp}>
          Reset Password
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
