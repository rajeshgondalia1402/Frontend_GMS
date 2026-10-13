import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { Button, Modal, PasswordInput, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import type { ShellVariant } from './Topbar'
import {
  ADMIN_PASSWORD_MAX_LENGTH,
  ADMIN_PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  adminCurrentPasswordRules,
  adminNewPasswordRules,
  confirmPasswordRules,
  currentPasswordRules,
  newPasswordRules,
} from '@/lib/validation'

interface ChangePasswordValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const EMPTY: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
  /** Which account's password is being changed (default: the garage owner). */
  variant?: ShellVariant
}

export function ChangePasswordModal({
  open,
  onClose,
  variant = 'owner',
}: ChangePasswordModalProps) {
  const { toast } = useToast()
  const { logout } = useAuth()
  const { logout: adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  const isAdmin = variant === 'admin'

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ mode: 'onTouched', defaultValues: EMPTY })

  // Never leave typed passwords sitting in a closed dialog.
  useEffect(() => {
    if (!open) {
      reset(EMPTY)
      setError(null)
      setSaving(false)
    }
  }, [open, reset])

  const close = () => {
    if (saving) return
    onClose()
  }

  // The admin is a different account type with a different limit: 6-72
  // characters, where a garage owner's password stops at 24.
  const maxLength = isAdmin ? ADMIN_PASSWORD_MAX_LENGTH : PASSWORD_MAX_LENGTH
  const minLength = isAdmin ? ADMIN_PASSWORD_MIN_LENGTH : PASSWORD_MIN_LENGTH
  const currentRules = isAdmin ? adminCurrentPasswordRules : currentPasswordRules
  const newRules = isAdmin ? adminNewPasswordRules : newPasswordRules

  const onSubmit = async (values: ChangePasswordValues) => {
    setSaving(true)
    setError(null)

    const payload = {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }

    try {
      if (isAdmin) await adminService.changePassword(payload)
      else await authService.changePassword(payload)

      // The old token stays valid until it expires, so signing out is the only
      // way to guarantee the next session uses the new password.
      reset(EMPTY)
      onClose()
      if (isAdmin) adminLogout('manual')
      else logout('manual')
      toast('Password changed successfully. Please login again.', 'success')
      navigate(isAdmin ? '/admin/login' : '/login', { replace: true })
    } catch (err) {
      // 401 here is a wrong current password — deliberately not a sign-out.
      setError(
        err instanceof ApiError ? err.message : 'Could not change your password. Please try again.',
      )
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Change Password"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={handleSubmit(onSubmit)}>
            Change Password
          </Button>
        </div>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordInput
          label="Current Password *"
          placeholder="Enter your current password"
          autoComplete="current-password"
          maxLength={maxLength}
          error={errors.currentPassword?.message}
          {...register('currentPassword', currentRules)}
        />

        <PasswordInput
          label="New Password *"
          placeholder="Enter a new password"
          autoComplete="new-password"
          maxLength={maxLength}
          hint={`${minLength}-${maxLength} characters`}
          error={errors.newPassword?.message}
          {...register('newPassword', newRules(() => getValues('currentPassword')))}
        />

        <PasswordInput
          label="Confirm New Password *"
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          maxLength={maxLength}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', confirmPasswordRules(() => getValues('newPassword')))}
        />

        <p className="text-xs text-slate-500">
          You will be signed out and asked to log in again with your new password.
        </p>

        {/* Lets Enter submit the form without a visible duplicate button */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}
