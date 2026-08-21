import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, MessageSquare, Pencil } from 'lucide-react'
import { Button, OtpInput, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/httpClient'
import {
  clearPendingRegistration,
  loadPendingRegistration,
  markPendingVerified,
} from '@/lib/pendingRegistration'
import { OTP_LENGTH, validateOtp } from '@/lib/validation'
import { useCountdown } from '@/hooks/useCountdown'
import { formatClock } from '@/lib/utils'

/** Seconds before "Send OTP again" becomes available. */
const RESEND_COOLDOWN_SECONDS = 60
/** The API keeps a code valid for 10 minutes. */
const OTP_VALIDITY_SECONDS = 10 * 60

/** Whichever request is in flight, if any. */
type Step = 'idle' | 'verifying' | 'registering' | 'signing-in'

const STEP_LABEL: Record<Exclude<Step, 'idle'>, string> = {
  verifying: 'Verifying code...',
  registering: 'Creating your account...',
  'signing-in': 'Signing you in...',
}

export function VerifyOtp() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  // Read once: the entry is cleared on success, and re-reading during the
  // sign-in step would otherwise blank the screen mid-redirect.
  const [pending] = useState(() => loadPendingRegistration())

  /** Flips to the confirmation panel once the code is accepted. */
  const [verified, setVerified] = useState(() => pending?.verified ?? false)

  const [code, setCode] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { seconds: resendIn, start: startResend } = useCountdown()
  const { seconds: validityLeft, start: startValidity } = useCountdown()
  const [codeSent, setCodeSent] = useState(false)

  // Guards the initial send against React StrictMode's double-invoked effect —
  // every call costs a real SMS.
  const requestedFor = useRef<string | null>(null)

  const busy = step !== 'idle'
  const payload = pending?.payload ?? null
  const mobileNumber = payload?.mobileNumber ?? ''

  const sendOtp = useCallback(
    async (mobile: string, isResend: boolean) => {
      setSendingOtp(true)
      setError(null)
      setNotice(null)

      try {
        await authService.generateOtp(mobile)
        setCodeSent(true)
        startResend(RESEND_COOLDOWN_SECONDS)
        startValidity(OTP_VALIDITY_SECONDS)
        if (isResend) {
          setCode('')
          setNotice('A new code has been sent to your mobile number.')
          toast('A new code has been sent', 'info')
        }
      } catch (err) {
        // 409 means the number was registered in the meantime — the form is the
        // only place that can fix that.
        setError(err instanceof ApiError ? err.message : 'Could not send the verification code.')
      } finally {
        setSendingOtp(false)
      }
    },
    [toast, startResend, startValidity],
  )

  // No parked registration means the user landed here directly.
  useEffect(() => {
    if (!pending) navigate('/register', { replace: true })
  }, [pending, navigate])

  // Send the first code as soon as the screen opens — but not after a refresh
  // on the confirmation panel, where the code has already been accepted.
  useEffect(() => {
    if (verified || !mobileNumber || requestedFor.current === mobileNumber) return
    requestedFor.current = mobileNumber
    void sendOtp(mobileNumber, false)
  }, [verified, mobileNumber, sendOtp])

  /** A payload the API rejected can only be fixed on the form itself. */
  const bounceToForm = useCallback(
    (err: ApiError) => {
      clearPendingRegistration()
      toast(err.message, 'error')
      navigate('/register', { state: { fieldErrors: err.fieldErrors } })
    },
    [navigate, toast],
  )

  /** Step 1 — check the code, then show the confirmation panel. */
  const verifyCode = useCallback(
    async (otp: string) => {
      if (!payload || busy) return

      const invalid = validateOtp(otp)
      if (invalid) {
        setError(invalid)
        return
      }

      setError(null)
      setNotice(null)
      setStep('verifying')

      try {
        await authService.verifyOtp(payload.mobileNumber, otp)
        markPendingVerified()
        setStep('idle')
        setVerified(true)
      } catch (err) {
        setStep('idle')
        setCode('')
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
    },
    [payload, busy],
  )

  /**
   * Step 2 — "Done" creates the account and signs the user in. Registration
   * returns no token, so the parked password is replayed against /auth/login.
   */
  const finishRegistration = useCallback(async () => {
    if (!payload || busy) return

    setError(null)

    try {
      setStep('registering')
      await authService.register(payload)

      setStep('signing-in')
      const session = await login({
        mobileNumber: payload.mobileNumber,
        password: payload.password,
      })

      clearPendingRegistration()
      toast(`Welcome to GaragePro, ${session.user.ownerName}!`, 'success')
      navigate('/app', { replace: true })
    } catch (err) {
      setStep('idle')

      if (!(err instanceof ApiError)) {
        setError('Something went wrong. Please try again.')
        return
      }
      if (err.fieldErrors.length || err.status === 409) {
        bounceToForm(err)
        return
      }
      setError(err.message)
    }
  }, [payload, busy, login, navigate, toast, bounceToForm])

  if (!payload) return null

  const errorBanner = error && (
    <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <p className="text-sm font-medium text-red-700">{error}</p>
    </div>
  )

  // ---------------------------------------------------------------- confirmed
  if (verified) {
    return (
      <div>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Mobile Number Verified</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">+91 {mobileNumber}</span> has been
            verified successfully. Tap Done to finish setting up your garage.
          </p>
        </div>

        {errorBanner}

        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">{payload.garageName}</p>
          <p className="mt-0.5 text-sm text-emerald-600">
            {payload.ownerName} · {payload.city}
          </p>
        </div>

        <Button fullWidth size="lg" loading={busy} onClick={() => void finishRegistration()}>
          {busy ? STEP_LABEL[step as Exclude<Step, 'idle'>] : 'Done'}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Your 30-day free trial starts as soon as your account is created.
        </p>
      </div>
    )
  }

  // ------------------------------------------------------------- code entry
  const canVerify = code.length === OTP_LENGTH && !busy && !sendingOtp
  const codeExpired = codeSent && validityLeft <= 0 && !sendingOtp

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Verify Your Mobile</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the {OTP_LENGTH}-digit code we sent to</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">+91 {mobileNumber}</span>
          <Link
            to="/register"
            aria-label="Change mobile number"
            className="text-slate-400 transition-colors hover:text-primary-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {errorBanner}

      {!error && notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-700">{notice}</p>
        </div>
      )}

      <OtpInput
        value={code}
        onChange={(next) => {
          setCode(next)
          if (error) setError(null)
        }}
        onComplete={(next) => void verifyCode(next)}
        length={OTP_LENGTH}
        error={Boolean(error)}
        disabled={busy || sendingOtp}
        autoFocus
      />

      <div className="mt-5 flex min-h-5 items-center justify-center gap-1.5 text-sm">
        {sendingOtp ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            <span className="text-slate-500">Sending code...</span>
          </>
        ) : resendIn > 0 ? (
          <p className="text-slate-500">
            Send OTP again in <span className="font-semibold text-slate-700">{formatClock(resendIn)}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void sendOtp(mobileNumber, true)}
            disabled={busy}
            className="font-semibold text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-50"
          >
            Send OTP again
          </button>
        )}
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-5"
        loading={busy}
        disabled={!canVerify}
        onClick={() => void verifyCode(code)}
      >
        {busy ? STEP_LABEL[step as Exclude<Step, 'idle'>] : 'Verify'}
      </Button>

      <p className="mt-4 text-center text-xs text-slate-400">
        {codeExpired
          ? 'Your code has expired — request a new one.'
          : validityLeft > 0
            ? `Code expires in ${formatClock(validityLeft)}`
            : 'The code is valid for 10 minutes.'}
      </p>

      <div className="my-6 border-t border-slate-100" />

      <p className="text-center text-sm text-slate-500">
        Entered the wrong number?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
          Go back
        </Link>
      </p>
    </div>
  )
}
