import { useEffect, useState } from 'react'
import { CarFront } from 'lucide-react'
import { ComboboxInput } from '@/components/jobcards/ComboboxInput'
import type { ComboOption } from '@/components/jobcards/ComboboxInput'
import { carSellingService } from '@/services/carSellingService'
import { ApiError } from '@/services/httpClient'
import { filterCarOptions } from '@/lib/carSold'
import type { CarSellingOption } from '@/types/carSold'

interface CarPickerInputProps {
  /** The car currently picked, or `null` while none is. */
  value: CarSellingOption | null
  onPick: (car: CarSellingOption | null) => void
  error?: string
}

/**
 * The searchable car dropdown: every car the garage still has FOR SALE, read
 * once from `GET /api/auth/car-selling/dropdown` and filtered here as the user
 * types — which is why that endpoint is not paged.
 *
 * Cars already sold are not on it: the API leaves them out, and offering one
 * would only earn a 409 on save.
 */
export function CarPickerInput({ value, onPick, error }: CarPickerInputProps) {
  const [cars, setCars] = useState<CarSellingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setListError(null)
    carSellingService
      .listCarSellingOptions()
      .then((data) => {
        if (!cancelled) setCars(data ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        setListError(err instanceof ApiError ? err.message : 'Could not load the cars for sale.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const picked = value !== null && typed === value.carNumber

  // A car already picked offers the whole list again, so switching is one tap.
  const options: ComboOption[] = (picked ? cars : filterCarOptions(cars, typed)).map((car) => ({
    id: car.id,
    title: car.carNumber,
    monoTitle: true,
    meta: car.carType ?? undefined,
  }))

  return (
    <ComboboxInput
      label="Car *"
      name="carSellingId"
      placeholder="Search by car number or type"
      leftIcon={<CarFront className="h-4 w-4" />}
      value={typed}
      onValueChange={(next) => {
        setTyped(next)
        // Typing over a picked car un-picks it: the details below belong to
        // whatever the box actually holds, or to nothing at all.
        if (value) onPick(null)
      }}
      options={options}
      onPick={(option) => {
        const car = cars.find((c) => c.id === option.id) ?? null
        setTyped(car?.carNumber ?? '')
        onPick(car)
      }}
      open={open}
      onOpenChange={setOpen}
      openOnFocus
      loading={loading}
      listError={listError}
      selected={picked}
      emptyLabel={
        cars.length === 0 ? 'No cars are for sale right now' : 'No car matches that search'
      }
      error={error}
    />
  )
}
