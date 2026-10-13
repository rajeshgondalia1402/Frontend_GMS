import { useCallback, useEffect, useState } from 'react'
import { listAllStaff } from '@/services/staffService'
import { ApiError } from '@/services/httpClient'
import type { StaffRecord, StaffStatus } from '@/types/staff'

export interface AllStaffState {
  /** Every staff member matching the requested status, A to Z by name. */
  staff: StaffRecord[]
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Loads the whole staff list once, for a picker that has to offer all of it.
 *
 * `status` narrows the query the way the API does: pass `'ACTIVE'` for a
 * picker that should only offer the people currently working, and leave it out
 * to get the active and the inactive staff together.
 */
export function useAllStaff(status?: StaffStatus): AllStaffState {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    listAllStaff({ status, sortBy: 'name', sortOrder: 'asc' })
      .then((rows) => {
        if (cancelled) return
        setStaff(rows)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setStaff([])
        setError(cause instanceof ApiError ? cause.message : 'Could not load the staff list.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, status])

  return { staff, loading, error, reload }
}
