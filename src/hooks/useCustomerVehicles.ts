import { useEffect, useState } from 'react'
import { listAllVehicles } from '@/services/vehicleService'
import { ApiError } from '@/services/httpClient'
import type { VehicleWithCustomer } from '@/types/vehicle'

export interface CustomerVehiclesState {
  vehicles: VehicleWithCustomer[]
  loading: boolean
  error: string | null
}

const IDLE: CustomerVehiclesState = { vehicles: [], loading: false, error: null }

interface CustomerVehiclesQuery {
  /** What to search on — the customer's mobile number, or their name. */
  search: string
  /**
   * The chosen customer. `search` is a text match, so the rows are narrowed to
   * this customer's own vehicles: a name two customers share, or a number that
   * reads as part of another, can never put someone else's car on the card.
   */
  customerId: string
}

/**
 * Every vehicle of the customer on the job card, loaded once they are chosen.
 *
 * There is no paging here on purpose: `listAllVehicles` walks the pages so the
 * picker offers the customer's whole fleet, however many that is.
 */
export function useCustomerVehicles({ search, customerId }: CustomerVehiclesQuery): CustomerVehiclesState {
  const [state, setState] = useState<CustomerVehiclesState>(IDLE)

  useEffect(() => {
    // No customer chosen yet — there is nothing to look their vehicles up by.
    if (!customerId || !search.trim()) {
      setState(IDLE)
      return
    }

    let cancelled = false
    setState({ vehicles: [], loading: true, error: null })

    listAllVehicles({ search: search.trim(), sortBy: 'vehicleNumber', sortOrder: 'asc' })
      .then((rows) => {
        if (cancelled) return
        const owned = rows.filter((vehicle) => !vehicle.customer || vehicle.customer.id === customerId)
        setState({ vehicles: owned, loading: false, error: null })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          vehicles: [],
          loading: false,
          error: cause instanceof ApiError ? cause.message : 'Could not load this customer’s vehicles.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [search, customerId])

  return state
}
