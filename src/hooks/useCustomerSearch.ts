import { useEffect, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { searchJobCardCustomers } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import type { CustomerRecord } from '@/types/customer'

export interface CustomerSearchState {
  results: CustomerRecord[]
  loading: boolean
  /** A message to show under the box; `null` while everything is fine. */
  error: string | null
}

const IDLE: CustomerSearchState = { results: [], loading: false, error: null }

/**
 * Type-ahead over this garage's customers, one request per pause in typing.
 *
 * The same endpoint serves the name box and the mobile box — the value itself
 * says which it is — so both call this hook with whatever the desk has typed
 * so far. `enabled` is false while the suggestion list is closed, so choosing
 * a customer (which writes their name into the box) does not search for them.
 */
export function useCustomerSearch(term: string, enabled = true): CustomerSearchState {
  const trimmed = term.trim()
  const debounced = useDebouncedValue(trimmed, 300)
  /** The box has moved on and the debounce has not caught up with it yet. */
  const settling = debounced !== trimmed
  const [state, setState] = useState<CustomerSearchState>(IDLE)

  useEffect(() => {
    // An empty `search` is a 400 — an empty box simply has nothing to ask for.
    if (!enabled || !trimmed) {
      setState(IDLE)
      return
    }

    // Never send a term the box no longer holds: re-opening the list mid-typing
    // would otherwise ask for the previous value and answer with stale rows.
    if (settling) return

    const controller = new AbortController()
    setState((prev) => ({ results: prev.results, loading: true, error: null }))

    searchJobCardCustomers(debounced, controller.signal)
      .then((results) => {
        if (controller.signal.aborted) return
        setState({ results, loading: false, error: null })
      })
      .catch((error: unknown) => {
        // Superseded by a later keystroke — its own request owns the state now.
        if (controller.signal.aborted) return
        const message =
          error instanceof ApiError ? error.message : 'Could not load customers. Please try again.'
        setState({ results: [], loading: false, error: message })
      })

    return () => controller.abort()
  }, [debounced, trimmed, settling, enabled])

  return state
}
