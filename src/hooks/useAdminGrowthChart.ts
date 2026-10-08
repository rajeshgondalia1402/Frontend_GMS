import { useCallback, useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import type { AdminGrowthChart } from '@/types/admin'

export interface AdminGrowthChartState {
  /** The chart for `year`, or `null` until its answer comes back. */
  chart: AdminGrowthChart | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** The admin dashboard's growth chart for one year, fetched again when it changes. */
export function useAdminGrowthChart(year: number): AdminGrowthChartState {
  const [chart, setChart] = useState<AdminGrowthChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    adminService
      .getDashboardGrowth(year)
      .then((data) => {
        if (cancelled) return
        setChart(data)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load the growth chart.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year, attempt])

  return { chart, loading, error, reload }
}
