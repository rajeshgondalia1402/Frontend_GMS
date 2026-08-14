import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, OtpInput, useToast } from '@/components/ui'

export function VerifyOtp() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(28)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const onVerify = () => {
    if (code.length < 6) {
      toast('Please enter the 6-digit code', 'warning')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('Mobile verified successfully!', 'success')
      navigate('/app')
    }, 900)
  }

  const resend = () => {
    setSeconds(28)
    toast('A new code has been sent', 'info')
  }

  const timer = `00:${seconds.toString().padStart(2, '0')}`

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Verify Your Mobile</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit verification code to your mobile number.
        </p>
      </div>

      <OtpInput length={6} onChange={setCode} />

      <div className="mt-5 text-center text-sm">
        {seconds > 0 ? (
          <p className="text-slate-500">
            Resend OTP in <span className="font-semibold text-slate-700">{timer}</span>
          </p>
        ) : (
          <button onClick={resend} className="font-semibold text-primary-600 hover:text-primary-700">
            Resend OTP
          </button>
        )}
      </div>

      <Button fullWidth size="lg" className="mt-5" loading={loading} onClick={onVerify}>
        Verify
      </Button>

      <p className="mt-5 text-center text-sm text-slate-500">
        <Link to="/register" className="font-medium text-slate-600 hover:text-slate-800">
          Change Mobile Number
        </Link>
      </p>
    </div>
  )
}
