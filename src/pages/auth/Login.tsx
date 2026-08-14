import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone } from 'lucide-react'
import { Button, Input, PasswordInput, useToast } from '@/components/ui'

interface LoginForm {
  mobile: string
  password: string
}

export function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('Welcome back!', 'success')
      navigate('/app')
    }, 900)
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Manage Your Garage Effortlessly</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          placeholder="+91 9876543210"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.mobile?.message}
          {...register('mobile', {
            required: 'Mobile number is required',
            pattern: { value: /^(\+91)?\s?\d{10}$/, message: 'Enter a valid 10-digit number' },
          })}
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
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
