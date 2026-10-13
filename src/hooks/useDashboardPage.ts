import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/httpClient'

export interface DashboardPageState<T> {
  /** The page last fetched, kept on screen while the next one loads. */
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * One page of a dashboard panel's list, fetched again when the page or its
 * size changes.
 *
 * `fetchPage` must be a stable function — a service export, not an inline
 * arrow — or every render would count as a new request.
 */
export function useDashboardPage<T>(
  fetchPage: (page: number, limit: number) => Promise<T>,
  page: number,
  limit: number,
  failure: string,
): DashboardPageState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPage(page, limit)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : failure)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetchPage, page, limit, failure, attempt])

  return { data, loading, error, reload }
}
