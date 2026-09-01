import { useCallback, useEffect, useState } from 'react'
import { getJobNumber } from '@/services/jobCardService'
import { ApiError } from '@/services/httpClient'

export interface JobNumberState {
  /** `JC-2026-0001`, or `''` until the API has answered. */
  jobNumber: string
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * The number for the card being opened, asked for as the screen loads.
 *
 * It is only a suggestion — nothing is reserved — so a stale one is no more
 * than a save the API turns away, and `reload` asks for the next free number.
 *
 * Pass `false` on a screen that is editing a card: that card already has its
 * number, and asking for the next free one would be a request for nothing.
 */
export function useJobNumber(enabled = true): JobNumberState {
  const [jobNumber, setJobNumber] = useState('')
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setLoading(true)
    setError(null)

    getJobNumber()
      .then((data) => {
        if (cancelled) return
        setJobNumber(data.jobNumber)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setJobNumber('')
        setError(cause instanceof ApiError ? cause.message : 'Could not get a job card number.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, enabled])

  return { jobNumber, loading, error, reload }
}
