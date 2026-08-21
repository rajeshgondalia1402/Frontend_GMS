import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, Phone } from 'lucide-react'
import { Button, Input, PasswordInput, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
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
    formState: { errors },
  } = useForm<LoginForm>({
    mode: 'onTouched',
    defaultValues: { mobileNumber: '', password: '' },
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login, logoutReason, clearLogoutReason } = useAuth()

  // Where the user was headed before the guard bounced them here.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app'

  // Explain an automatic sign-out (token expired) instead of silently landing here.
  useEffect(() => {
    if (logoutReason === 'expired') {
      setFormError('Your session has expired. Please sign in again.')
      clearLogoutReason()
    }
  }, [logoutReason, clearLogoutReason])

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onSubmit = async ({ mobileNumber, password }: LoginForm) => {
    setLoading(true)
    setFormError(null)

    try {
      const session = await login({ mobileNumber: mobileNumber.trim(), password })
      toast(`Welcome back, ${session.user.ownerName}!`, 'success')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // 401 carries the API's deliberately vague "Invalid mobile number or password."
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
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Manage Your Garage Effortlessly</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
      </div>

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

      <div className="my-6 border-t border-slate-100" />

      <p className="text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
          Create Garage Account
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-slate-400">
        Platform admin?{' '}
        <Link to="/admin" className="font-medium text-slate-500 hover:text-slate-700">
          Admin login
        </Link>
      </p>
    </div>
  )
}
