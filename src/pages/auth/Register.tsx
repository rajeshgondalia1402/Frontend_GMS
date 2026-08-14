import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ShieldCheck } from 'lucide-react'
import { Button, Input, PasswordInput, useToast } from '@/components/ui'

interface RegisterForm {
  ownerName: string
  mobile: string
  garageName: string
  password: string
}

export function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('Account created! Verify your mobile.', 'success')
      navigate('/verify-otp')
    }, 900)
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Create Your Garage</h1>
        <p className="mt-1 text-sm text-slate-500">Start your 30-day free trial.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Owner Name"
          placeholder="Rajesh Patel"
          error={errors.ownerName?.message}
          {...register('ownerName', { required: 'Owner name is required' })}
        />
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          error={errors.mobile?.message}
          {...register('mobile', {
            required: 'Mobile number is required',
            pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit number' },
          })}
        />
        <Input
          label="Garage Name"
          placeholder="ABC Auto Garage"
          error={errors.garageName?.message}
          {...register('garageName', { required: 'Garage name is required' })}
        />
        <PasswordInput
          label="Password"
          placeholder="Create a password"
          hint="At least 6 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Must be at least 6 characters' },
          })}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
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
