import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'

interface ForgotForm { mobile: string }

export function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('OTP sent to your mobile', 'success')
      navigate('/reset-password')
    }, 900)
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Forgot Password?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your mobile number and we'll help you reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.mobile?.message}
          {...register('mobile', {
            required: 'Mobile number is required',
            pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit number' },
          })}
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
