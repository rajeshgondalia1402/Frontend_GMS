import { useCallback, useEffect, useState } from 'react'
import { paymentService } from '@/services/paymentService'
import { ApiError } from '@/services/httpClient'
import type { JobCardMoney, JobCardPaymentsData, PaymentRecord } from '@/types/payment'

export interface JobCardPaymentsState {
  /** The card's money, or `null` until the first answer comes back. */
  money: JobCardMoney | null
  /** Live receipts, oldest first. */
  payments: PaymentRecord[]
  loading: boolean
  error: string | null
  reload: () => void
  /**
   * Writes an answer a mutation already returned straight into state.
   *
   * Every payment endpoint hands back the re-settled card, so recording,
   * correcting or cancelling a receipt does not need a second request to know
   * the new balance — only the history has to be asked for again.
   */
  applyMoney: (money: JobCardMoney) => void
}

/**
 * The payment screen for one job card: what it is worth, what has been
 * collected, what is still to pay, and every receipt behind those numbers.
 */
export function useJobCardPayments(jobCardId: string): JobCardPaymentsState {
  const [money, setMoney] = useState<JobCardMoney | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  const applyMoney = useCallback((next: JobCardMoney) => setMoney(next), [])

  useEffect(() => {
    if (!jobCardId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    paymentService
      .getJobCardPayments(jobCardId)
      .then((data: JobCardPaymentsData) => {
        if (cancelled) return
        setMoney(data.jobCard)
        setPayments(data.payments ?? [])
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load the payments.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [jobCardId, attempt])

  return { money, payments, loading, error, reload, applyMoney }
}
