import { useCallback, useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import type { AdminDashboardSummary } from '@/types/admin'

export interface AdminDashboardSummaryState {
  /** The counts, or `null` until the first answer comes back. */
  summary: AdminDashboardSummary | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** The admin dashboard's count tiles, in one request. */
export function useAdminDashboardSummary(): AdminDashboardSummaryState {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    adminService
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
