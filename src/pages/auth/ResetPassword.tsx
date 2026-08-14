import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, PasswordInput, useToast } from '@/components/ui'

interface ResetForm { password: string; confirm: string }

export function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('Password reset successfully', 'success')
      navigate('/login')
    }, 900)
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Create New Password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          hint="Password must contain at least 6 characters."
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Must be at least 6 characters' },
          })}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter password"
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Please confirm your password',
            validate: (v) => v === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
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
