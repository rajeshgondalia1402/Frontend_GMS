import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '@/services/dashboardService'
import { ApiError } from '@/services/httpClient'
import type { DashboardSummary } from '@/types/dashboard'

export interface DashboardSummaryState {
  /** The figures, or `null` until the first answer comes back. */
  summary: DashboardSummary | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** The dashboard's tiles, in one request rather than one per figure. */
export function useDashboardSummary(): DashboardSummaryState {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    dashboardService
      .getDashboardSummary()
      .then((data) => {
        if (cancelled) return
        setSummary(data)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load the dashboard.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  return { summary, loading, error, reload }
}
