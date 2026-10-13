import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { carSellingService } from '@/services/carSellingService'
import { ApiError } from '@/services/httpClient'
import { carOwnerLabel, carTitle, sellingPriceLabel } from '@/lib/carSelling'
import type { CarSellingRecord } from '@/types/carSelling'

interface SelectedCarDetailsProps {
  /** The listing picked in the dropdown, or `null` while none is. */
  carSellingId: string
  /** Handed up so the form can offer the asking price as the final price. */
  onLoaded?: (car: CarSellingRecord) => void
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{children}</p>
    </div>
  )
}

/**
 * The picked car, read only, from `GET /api/auth/car-selling/:id`: who is
 * selling it, how to reach them, what they are asking and how many owners it
 * has had. Nothing here can be edited — this is the listing, not the sale.
 */
export function SelectedCarDetails({ carSellingId, onLoaded }: SelectedCarDetailsProps) {
  const [car, setCar] = useState<CarSellingRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!carSellingId) {
      setCar(null)
      setError(null)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)
    carSellingService
      .getCarSelling(carSellingId)
      .then((data) => {
        if (cancelled) return
        setCar(data)
        onLoaded?.(data)
      })
      .catch((err) => {
        if (cancelled) return
        setCar(null)
        setError(err instanceof ApiError ? err.message : 'Could not load this car.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // onLoaded is the caller's callback; re-reading the car when it changes
    // identity would put the form back to the asking price as it is typed over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carSellingId])

  if (!carSellingId) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        Pick a car above to see who is selling it and what they are asking.
      </p>
    )
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading car details…
      </p>
    )
  }

  if (error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        {error}
      </p>
    )
  }

  if (!car) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-slate-900">{carTitle(car)}</p>
        <p className="font-mono text-sm font-semibold tracking-wide text-slate-700">
          {car.carNumber}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Detail label="Owner Name">{car.ownerName}</Detail>
        <Detail label="Mobile Number">{car.mobileNumber}</Detail>
        <Detail label="Asking Price">{sellingPriceLabel(car.sellingPrice) ?? '—'}</Detail>
        <Detail label="Car Owner">{carOwnerLabel(car.carOwner) ?? '—'}</Detail>
      </div>
    </div>
  )
}
