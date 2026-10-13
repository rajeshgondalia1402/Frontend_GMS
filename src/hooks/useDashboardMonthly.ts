import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '@/services/dashboardService'
import { ApiError } from '@/services/httpClient'
import type { DashboardMonthlyChart } from '@/types/dashboard'

export interface DashboardMonthlyState {
  /** The chart for `year`, or `null` until its answer comes back. */
  chart: DashboardMonthlyChart | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** The dashboard's monthly bar charts for one year, fetched again when it changes. */
export function useDashboardMonthly(year: number): DashboardMonthlyState {
  const [chart, setChart] = useState<DashboardMonthlyChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    dashboardService
      .getDashboardMonthly(year)
      .then((data) => {
        if (cancelled) return
        setChart(data)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load the charts.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year, attempt])

  return { chart, loading, error, reload }
}
