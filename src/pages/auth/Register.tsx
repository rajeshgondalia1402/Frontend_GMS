import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone, ShieldCheck } from 'lucide-react'
import { Button, Input, PasswordInput } from '@/components/ui'
import { savePendingRegistration } from '@/lib/pendingRegistration'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  cityRules,
  garageNameRules,
  mobileNumberRules,
  normalizeMobileInput,
  optionalEmailRules,
  ownerNameRules,
  passwordRules,
} from '@/lib/validation'
import type { ApiFieldError, RegisterPayload } from '@/types/auth'

interface RegisterForm {
  ownerName: string
  mobileNumber: string
  garageName: string
  city: string
  email: string
  password: string
}

/** Fields the API can report a validation error against. */
const FORM_FIELDS: (keyof RegisterForm)[] = [
  'ownerName',
  'mobileNumber',
  'garageName',
  'city',
  'email',
  'password',
]

export function Register() {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<RegisterForm>({
    mode: 'onTouched',
    defaultValues: { ownerName: '', mobileNumber: '', garageName: '', city: '', email: '', password: '' },
  })

  const navigate = useNavigate()
  const location = useLocation()

  // The OTP screen sends the user back here when the API rejects the payload
  // it replayed, so those field errors are surfaced on the form that owns them.
  const state = location.state as { fieldErrors?: ApiFieldError[]; values?: RegisterForm } | null

  useEffect(() => {
    if (!state?.fieldErrors?.length) return

    for (const { field, message } of state.fieldErrors) {
      if ((FORM_FIELDS as string[]).includes(field)) {
        setError(field as keyof RegisterForm, { type: 'server', message })
      }
    }
    setFocus(state.fieldErrors[0].field as keyof RegisterForm)
    // Drop the state so a refresh does not replay stale errors.
    navigate(location.pathname, { replace: true, state: null })
  }, [state, setError, setFocus, navigate, location.pathname])

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onSubmit = (values: RegisterForm) => {
    const email = values.email.trim()

    const payload: RegisterPayload = {
      ownerName: values.ownerName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      password: values.password,
      garageName: values.garageName.trim(),
      city: values.city.trim(),
      // Optional — omit the key entirely rather than sending an empty string.
      ...(email ? { email } : {}),
    }

    // The account is only created after the mobile number is verified, so the
    // payload waits here while the user completes the OTP step.
    savePendingRegistration(payload)
    navigate('/verify-otp')
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Create Your Garage</h1>
        <p className="mt-1 text-sm text-slate-500">Start your 30-day free trial.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Owner Name"
          placeholder="Rajesh Patel"
          autoComplete="name"
          error={errors.ownerName?.message}
          {...register('ownerName', ownerNameRules)}
        />

        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9876543210"
          leftIcon={<Phone className="h-4 w-4" />}
          hint="We'll send a verification code to this number."
          error={errors.mobileNumber?.message}
          {...mobileField}
          onChange={(e) => {
            e.target.value = normalizeMobileInput(e.target.value)
            void mobileField.onChange(e)
          }}
        />

        <Input
          label="Garage Name"
          placeholder="ABC Auto Garage"
          autoComplete="organization"
          error={errors.garageName?.message}
          {...register('garageName', garageNameRules)}
        />

        <Input
          label="City"
          placeholder="Ahmedabad"
          autoComplete="address-level2"
          error={errors.city?.message}
          {...register('city', cityRules)}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          hint="Optional"
          error={errors.email?.message}
          {...register('email', optionalEmailRules)}
        />

        <PasswordInput
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          hint={`${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`}
          error={errors.password?.message}
          {...register('password', passwordRules)}
        />

        <Button type="submit" fullWidth size="lg">
          Create Account
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
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
