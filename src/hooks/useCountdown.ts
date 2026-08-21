import { useEffect, useState } from 'react'

/**
 * A seconds counter that ticks down to zero and stops.
 * Shared by the OTP screens for their resend cooldown and validity timers.
 */
export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  return { seconds, start: setSeconds }
}
