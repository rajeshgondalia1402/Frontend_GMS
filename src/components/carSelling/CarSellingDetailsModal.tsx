import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  CarFront,
  Fuel,
  Hash,
  MapPin,
  Palette,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { carSellingService } from '@/services/carSellingService'
import { ApiError } from '@/services/httpClient'
import { carOwnerLabel, carTitle, sellingPriceLabel } from '@/lib/carSelling'
import { formatDate } from '@/lib/utils'
import type { CarSellingRecord } from '@/types/carSelling'
import { CarFlagBadges } from './CarFlagBadges'

interface CarSellingDetailsModalProps {
  open: boolean
  onClose: () => void
  /** The row that was opened — shown at once, then refreshed from the API. */
  car: CarSellingRecord | null
  onEdit: (car: CarSellingRecord) => void
  onDelete: (car: CarSellingRecord) => void
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{children}</p>
    </div>
  )
}

/** Everything saved about one car, read fresh from `GET /api/auth/car-selling/:id`. */
export function CarSellingDetailsModal({
  open,
  onClose,
  car,
  onEdit,
  onDelete,
}: CarSellingDetailsModalProps) {
  const [fresh, setFresh] = useState<CarSellingRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !car) return
    let cancelled = false

    setFresh(null)
    setError(null)
    carSellingService
      .getCarSelling(car.id)
      .then((data) => {
        if (!cancelled) setFresh(data)
      })
      .catch((err) => {
        if (cancelled) return
        // The list row is still worth showing; only a 404 means it is gone.
        if (err instanceof ApiError && err.status === 404) {
          setError('This car is no longer on the list — it may have been deleted.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, car])

  const shown = fresh ?? car
  if (!shown) return null

  const price = sellingPriceLabel(shown.sellingPrice)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Car Details"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            disabled={Boolean(error)}
            onClick={() => onDelete(shown)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <Button
            fullWidth
            leftIcon={<Pencil className="h-4 w-4" />}
            disabled={Boolean(error)}
            onClick={() => onEdit(shown)}
          >
            Edit
          </Button>
        </div>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <CarFront className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{carTitle(shown)}</p>
          <p className="text-sm text-slate-500">
            {[shown.yearOfVehicle, shown.fuelType, carOwnerLabel(shown.carOwner)]
              .filter(Boolean)
              .join(' · ') || 'Year and ownership not added'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">Selling Price</p>
        <p
          className={
            price ? 'text-2xl font-bold text-slate-900' : 'text-base font-medium text-slate-400'
          }
        >
          {price ?? 'Price not set yet'}
        </p>
      </div>

      <div className="mt-4">
        <CarFlagBadges car={shown} showInsuranceDate />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Detail label="Car Number">
          {shown.carNumber ? (
            <span className="inline-flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {shown.carNumber}
            </span>
          ) : (
            '—'
          )}
        </Detail>
        <Detail label="Fuel Type">
          {shown.fuelType ? (
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {shown.fuelType}
            </span>
          ) : (
            '—'
          )}
        </Detail>
        <Detail label="Color">
          {shown.carColor ? (
            <span className="inline-flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {shown.carColor}
            </span>
          ) : (
            '—'
          )}
        </Detail>
        <Detail label="Owner">{shown.ownerName}</Detail>
        <Detail label="Mobile">
          <a
            href={`tel:${shown.mobileNumber}`}
            className="inline-flex items-center gap-1.5 text-primary-700 hover:underline"
          >
            <Phone className="h-3.5 w-3.5" /> {shown.mobileNumber}
          </a>
        </Detail>
        <div className="col-span-2">
          <Detail label="Address">
            {shown.address ? (
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                {shown.address}
              </span>
            ) : (
              '—'
            )}
          </Detail>
        </div>
        <div className="col-span-2">
          <Detail label="Description">
            {shown.description ? (
              <span className="whitespace-pre-line">{shown.description}</span>
            ) : (
              '—'
            )}
          </Detail>
        </div>
        <Detail label="Added On">{shown.createdAt ? formatDate(shown.createdAt) : '—'}</Detail>
      </div>
    </Modal>
  )
}
