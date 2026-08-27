import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, Phone, ShieldCheck } from 'lucide-react'
import { Button, Input, PasswordInput, useToast } from '@/components/ui'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { ApiError } from '@/services/httpClient'
import {
  ADMIN_PASSWORD_MAX_LENGTH,
  enteredPasswordRules,
  mobileNumberRules,
  normalizeMobileInput,
} from '@/lib/validation'

interface AdminLoginForm {
  mobileNumber: string
  password: string
}

/**
 * The platform admin's own sign-in, at `/admin/login`. Nothing in the garage
 * app links here — an admin types the address — so the page stands on its own
 * rather than sharing the garage `AuthLayout`.
 */
export function AdminLogin() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    mode: 'onTouched',
    defaultValues: { mobileNumber: '', password: '' },
  })

  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login, logoutReason, clearLogoutReason } = useAdminAuth()

  // Where the admin was headed before the guard bounced them here.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin'

  // Explain an automatic sign-out (token expired) instead of silently landing here.
  useEffect(() => {
    if (logoutReason === 'expired') {
      setFormError('Your session has expired. Please sign in again.')
      clearLogoutReason()
    }
  }, [logoutReason, clearLogoutReason])

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onSubmit = async ({ mobileNumber, password }: AdminLoginForm) => {
    setLoading(true)
    setFormError(null)

    try {
      const session = await login({ mobileNumber: mobileNumber.trim(), password })
      toast(`Welcome back, ${session.admin.name}!`, 'success')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // 401 carries the API's deliberately vague "Invalid mobile number or password."
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
      setFormError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-white">GaragePro Admin</span>
            <p className="mt-1 text-sm text-slate-400">Platform administration</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="mb-6 text-center">
              <h1 className="text-lg font-bold text-slate-900">Admin Sign In</h1>
              <p className="mt-1 text-sm text-slate-500">
                Use your platform admin credentials
              </p>
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
                maxLength={ADMIN_PASSWORD_MAX_LENGTH}
                error={errors.password?.message}
                {...register('password', enteredPasswordRules)}
              />

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Login
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © 2026 GaragePro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
