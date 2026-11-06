import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Info,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { RegisterStepIndicator } from '@/components/auth/RegisterSteps'
import type { RegisterStep } from '@/components/auth/RegisterSteps'
import { Button, Input, OtpInput, PasswordInput, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useCountdown } from '@/hooks/useCountdown'
import { authService } from '@/services/authService'
import { ApiError, otpErrorData } from '@/services/httpClient'
import { formatClock } from '@/lib/utils'
import {
  OTP_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  cityRules,
  garageNameRules,
  mobileNumberRules,
  normalizeMobileInput,
  optionalEmailRules,
  ownerNameRules,
  passwordRules,
  validateOtp,
} from '@/lib/validation'
import type { RegisterPayload } from '@/types/auth'

interface MobileForm {
  mobileNumber: string
}

interface DetailsForm {
  ownerName: string
  garageName: string
  city: string
  email: string
  password: string
}

/** Fields of the details step the API can report a validation error against. */
const DETAIL_FIELDS: (keyof DetailsForm)[] = ['ownerName', 'garageName', 'city', 'email', 'password']

/** The paid plans the public pricing page can send a visitor here with. */
const PAID_PLAN_LABELS: Record<string, string> = {
  monthly: 'Premium Monthly',
  yearly: 'Premium Yearly',
}

/** Fallbacks only: the API answers with its own cooldown and validity. */
const OTP_VALIDITY_SECONDS = 5 * 60

/** Left behind by the old flow (it held the form, password included). */
const LEGACY_PENDING_KEY = 'gms.auth.pendingRegistration'

/**
 * Registration, in this order and no other:
 *   1. Mobile      - POST /auth/check-mobile; a registered number goes to login
 *                    (one account per number, for life: an ended plan is renewed
 *                    after login, never by registering again)
 *   2. Verify OTP  - generate-otp + verify-otp -> a single-use verificationId
 *   3. Details     - owner / garage / password -> POST /auth/register with that
 *                    verificationId -> account + 30-day free trial -> signed in
 *
 * The verification lives in this component's memory only. Leaving the page,
 * reloading it or changing the number throws it away, and the API drops it
 * when a new OTP is requested or after 30 minutes - so a number that was
 * verified but never registered always has to verify again.
 */
export function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const pickedPlan = PAID_PLAN_LABELS[searchParams.get('plan') ?? ''] ?? null

  const [step, setStep] = useState<RegisterStep>('mobile')
  const [mobileNumber, setMobileNumber] = useState('')

  // ---- step 1
  const mobileForm = useForm<MobileForm>({ mode: 'onTouched', defaultValues: { mobileNumber: '' } })
  const [checking, setChecking] = useState(false)
  const [registeredNotice, setRegisteredNotice] = useState<string | null>(null)
  const [mobileError, setMobileError] = useState<string | null>(null)

  // ---- step 2
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpNotice, setOtpNotice] = useState<string | null>(null)
  const { seconds: resendIn, start: startResend } = useCountdown()
  const { seconds: validityLeft, start: startValidity } = useCountdown()

  // ---- step 3
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const detailsForm = useForm<DetailsForm>({
    mode: 'onTouched',
    defaultValues: { ownerName: '', garageName: '', city: '', email: '', password: '' },
  })
  const [creating, setCreating] = useState<'registering' | 'signing-in' | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // The old two-page flow parked the whole form (password included) in
  // sessionStorage; nothing reads it any more.
  useEffect(() => {
    try {
      sessionStorage.removeItem(LEGACY_PENDING_KEY)
    } catch {
      /* storage blocked */
    }
  }, [])

  /** Back to step 1, forgetting the OTP and any verification. */
  const restart = useCallback(
    (message?: string) => {
      setStep('mobile')
      setChallengeId(null)
      setVerificationId(null)
      setCode('')
      setOtpError(null)
      setOtpNotice(null)
      startValidity(0)
      setMobileError(message ?? null)
    },
    [startValidity],
  )

  /** Sends (or re-sends) the registration OTP. Returns true once a code is on its way. */
  const sendOtp = useCallback(
    async (mobile: string, isResend: boolean): Promise<boolean> => {
      setSendingOtp(true)
      setOtpError(null)
      setOtpNotice(null)
      try {
        const data = await authService.generateOtp(mobile)
        setChallengeId(data.challengeId)
        startResend(data.resendAfterSeconds ?? OTP_VALIDITY_SECONDS)
        startValidity(data.expiresInSeconds ?? OTP_VALIDITY_SECONDS)
        if (isResend) {
          setCode('')
          setOtpNotice('A new code has been sent to your mobile number.')
        }
        return true
      } catch (err) {
        const data = otpErrorData(err)
        if (data.retryAfterSeconds) startResend(data.retryAfterSeconds)

        // The SMS may still arrive: keep the code entry open for it.
        if (data.code === 'OTP_SEND_UNCONFIRMED' && data.challengeId) {
          setChallengeId(data.challengeId)
          startValidity(data.expiresInSeconds ?? OTP_VALIDITY_SECONDS)
          setOtpError(err instanceof ApiError ? err.message : 'We could not confirm that the OTP was sent.')
          return true
        }

        // Registered in the meantime (or the check was skipped): go to login.
        if (err instanceof ApiError && err.status === 409) {
          setRegisteredNotice(err.message)
          return false
        }

        const message = err instanceof ApiError ? err.message : 'Could not send the verification code.'
        if (isResend) setOtpError(message)
        else setMobileError(message)
        return false
      } finally {
        setSendingOtp(false)
      }
    },
    [startResend, startValidity],
  )

  // ------------------------------------------------------------------ step 1
  const continueWithMobile = mobileForm.handleSubmit(async ({ mobileNumber: typed }) => {
    const mobile = typed.trim()
    setRegisteredNotice(null)
    setMobileError(null)
    setChecking(true)
    try {
      const result = await authService.checkMobile(mobile)
      if (result.registered) {
        setRegisteredNotice(result.message ?? 'This mobile number already has an account. Please login.')
        return
      }
      if (await sendOtp(mobile, false)) {
        setMobileNumber(mobile)
        setCode('')
        setStep('otp')
      }
    } catch (err) {
      setMobileError(err instanceof ApiError ? err.message : 'Could not check the mobile number. Please try again.')
    } finally {
      setChecking(false)
    }
  })

  const goToLogin = () =>
    navigate('/login', { state: { mobileNumber: mobileForm.getValues('mobileNumber').trim(), fromRegister: true } })

  // ------------------------------------------------------------------ step 2
  const verifyCode = async (otp: string) => {
    if (verifying) return
    const invalid = validateOtp(otp)
    if (invalid) {
      setOtpError(invalid)
      return
    }

    setOtpError(null)
    setOtpNotice(null)
    setVerifying(true)
    try {
      const result = await authService.verifyOtp(mobileNumber, otp, challengeId ?? undefined)
      setVerificationId(result.verificationId)
      setStep('details')
      toast('Mobile number verified', 'success')
      setTimeout(() => detailsForm.setFocus('ownerName'), 0)
    } catch (err) {
      setCode('')
      const { code: errorCode } = otpErrorData(err)
      if (errorCode === 'OTP_EXPIRED' || errorCode === 'OTP_ATTEMPTS_EXCEEDED' || errorCode === 'OTP_SUPERSEDED') {
        startValidity(0)
      }
      setOtpError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  // ------------------------------------------------------------------ step 3
  const createAccount = detailsForm.handleSubmit(async (values) => {
    if (!verificationId) {
      restart('Please verify your mobile number first.')
      return
    }

    const email = values.email.trim()
    const payload: RegisterPayload = {
      ownerName: values.ownerName.trim(),
      mobileNumber,
      password: values.password,
      garageName: values.garageName.trim(),
      city: values.city.trim(),
      ...(email ? { email } : {}),
      verificationId,
    }

    setDetailsError(null)
    try {
      setCreating('registering')
      await authService.register(payload)

      setCreating('signing-in')
      const session = await login({ mobileNumber, password: values.password })
      toast(`Welcome to GaragePilot, ${session.user.ownerName}! Your 30-day free trial has started.`, 'success')
      navigate('/app', { replace: true })
    } catch (err) {
      setCreating(null)
      if (!(err instanceof ApiError)) {
        setDetailsError('Something went wrong. Please try again.')
        return
      }

      const data = (err.payload as { data?: { code?: string } } | null)?.data
      // The verification ran out or was replaced: the number must verify again.
      if (err.status === 403 && data?.code === 'MOBILE_NOT_VERIFIED') {
        restart(err.message)
        return
      }
      if (err.status === 409) {
        restart()
        setRegisteredNotice(err.message)
        return
      }

      let shown = false
      for (const { field, message } of err.fieldErrors) {
        if ((DETAIL_FIELDS as string[]).includes(field)) {
          detailsForm.setError(field as keyof DetailsForm, { type: 'server', message })
          shown = true
        }
      }
      if (!shown) setDetailsError(err.message)
    }
  })

  // ------------------------------------------------------------------ render
  const mobileField = mobileForm.register('mobileNumber', mobileNumberRules)
  const codeExpired = Boolean(challengeId) && validityLeft <= 0 && !sendingOtp

  return (
    <div>
      <AuthHeader
        title={
          step === 'mobile' ? 'Create your garage account' : step === 'otp' ? 'Verify your mobile' : 'Tell us about your garage'
        }
        subtitle={
          step === 'mobile'
            ? 'Start with your mobile number — it becomes your login. 30-day free trial, no card required.'
            : step === 'otp'
              ? 'One quick check so nobody else can register with your number.'
              : 'Almost done. These details appear on your job cards and bills.'
        }
      />

      <RegisterStepIndicator current={step} />

      {pickedPlan && step === 'mobile' && (
        <p className="mb-5 rounded-lg border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-xs leading-relaxed text-primary-800">
          <span className="font-semibold">{pickedPlan}</span> selected. Every account starts on the free trial,
          so create your garage first — the plan is waiting for you on the Subscription screen inside the app.
        </p>
      )}

      {/* ---------------------------------------------------------- 1. mobile */}
      {step === 'mobile' && (
        <form onSubmit={(event) => void continueWithMobile(event)} noValidate className="space-y-4">
          <Input
            label="Mobile Number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9876543210"
            autoFocus
            leftIcon={<Phone className="h-4 w-4" />}
            hint="+91 · We'll send a 6-digit code to verify this number."
            error={mobileForm.formState.errors.mobileNumber?.message}
            {...mobileField}
            onChange={(e) => {
              e.target.value = normalizeMobileInput(e.target.value)
              setRegisteredNotice(null)
              setMobileError(null)
              void mobileField.onChange(e)
            }}
          />

          {registeredNotice && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">{registeredNotice}</p>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button type="button" size="sm" fullWidth leftIcon={<LogIn className="h-4 w-4" />} onClick={goToLogin}>
                  Login with this number
                </Button>
                <Button type="button" size="sm" fullWidth variant="outline" onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </Button>
              </div>
            </div>
          )}

          {mobileError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{mobileError}</p>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={checking}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Send OTP
          </Button>
        </form>
      )}

      {/* ------------------------------------------------------------- 2. OTP */}
      {step === 'otp' && (
        <div>
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500">Enter the {OTP_LENGTH}-digit code we sent to</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              +91 {mobileNumber}{' '}
              <button
                type="button"
                onClick={() => restart()}
                className="ml-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Change
              </button>
            </p>
          </div>

          {otpError && (
            <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{otpError}</p>
            </div>
          )}
          {!otpError && otpNotice && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-700">{otpNotice}</p>
            </div>
          )}

          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next)
              if (otpError) setOtpError(null)
            }}
            onComplete={(next) => void verifyCode(next)}
            length={OTP_LENGTH}
            error={Boolean(otpError)}
            disabled={verifying || sendingOtp}
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
                disabled={verifying}
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
            loading={verifying}
            disabled={code.length !== OTP_LENGTH || verifying || sendingOtp}
            onClick={() => void verifyCode(code)}
          >
            {verifying ? 'Verifying code...' : 'Verify Mobile Number'}
          </Button>

          <p className="mt-4 text-center text-xs text-slate-400">
            {codeExpired
              ? 'Your code has expired — request a new one.'
              : validityLeft > 0
                ? `Code expires in ${formatClock(validityLeft)}`
                : 'The code is valid for 5 minutes.'}
          </p>
        </div>
      )}

      {/* --------------------------------------------------------- 3. details */}
      {step === 'details' && (
        <form onSubmit={(event) => void createAccount(event)} noValidate className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <BadgeCheck className="h-5 w-5 text-emerald-500" />
              +91 {mobileNumber}
              <span className="text-xs font-medium text-emerald-600">Verified</span>
            </span>
            <button
              type="button"
              onClick={() => restart()}
              disabled={Boolean(creating)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              Change
            </button>
          </div>

          <Input
            label="Owner Name"
            placeholder="Rajesh Patel"
            autoComplete="name"
            leftIcon={<User className="h-4 w-4" />}
            error={detailsForm.formState.errors.ownerName?.message}
            {...detailsForm.register('ownerName', ownerNameRules)}
          />

          <Input
            label="Garage Name"
            placeholder="ABC Auto Garage"
            autoComplete="organization"
            leftIcon={<Store className="h-4 w-4" />}
            error={detailsForm.formState.errors.garageName?.message}
            {...detailsForm.register('garageName', garageNameRules)}
          />

          <Input
            label="City"
            placeholder="Ahmedabad"
            autoComplete="address-level2"
            leftIcon={<MapPin className="h-4 w-4" />}
            error={detailsForm.formState.errors.city?.message}
            {...detailsForm.register('city', cityRules)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            leftIcon={<Mail className="h-4 w-4" />}
            hint="Optional"
            error={detailsForm.formState.errors.email?.message}
            {...detailsForm.register('email', optionalEmailRules)}
          />

          <PasswordInput
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            hint={`${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters · used with your mobile number to log in`}
            error={detailsForm.formState.errors.password?.message}
            {...detailsForm.register('password', passwordRules)}
          />

          {detailsError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{detailsError}</p>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={Boolean(creating)}>
            {creating === 'registering'
              ? 'Creating your account...'
              : creating === 'signing-in'
                ? 'Signing you in...'
                : 'Create Account'}
          </Button>
        </form>
      )}

      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        30-day free trial • No payment required
      </div>

      <div className="my-6 border-t border-slate-100" />

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Login
        </Link>
      </p>
    </div>
  )
}
