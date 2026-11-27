import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle, Check } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { vehicleService } from '@/services/vehicleService'
import { ApiError } from '@/services/httpClient'
import {
  applyVehicleApiError,
  applyVehicleUpdate,
  nextVisitFormValues,
  toCreateVehiclePayload,
  toUpdateVehiclePayload,
  vehicleToFormValues,
} from '@/lib/vehicleForm'
import type { VehicleFormValues } from '@/lib/vehicleForm'
import type { VehicleRecord, VehicleSummary } from '@/types/vehicle'
import { VehicleFields } from './VehicleFields'

interface VehicleFormCardProps {
  customerId: string
  /** Shown in the heading, so it is clear whose vehicle this is. */
  customerName?: string
  /**
   * Fills the form in from a vehicle already on file, so a returning one is
   * not retyped. Remount the form (key on the vehicle id) to seed it again.
   */
  seed?: VehicleSummary
  /**
   * The vehicle being edited. Set it and the form saves over that row with
   * `PUT` instead of creating a new one — same fields, same page, only the
   * button and the request change.
   */
  editing?: VehicleRecord
  /** Hands the saved row back so the page can list it. */
  onSaved: (vehicle: VehicleRecord) => void
  onCancel: () => void
  /** Label of the cancel button — "Skip for now" during the new-customer flow. */
  cancelLabel?: string
  /** Leaves the heading out where the page already says what the form is for. */
  hideHeading?: boolean
}

export function VehicleFormCard({
  customerId,
  customerName,
  seed,
  editing,
  onSaved,
  onCancel,
  cancelLabel = 'Cancel',
  hideHeading = false,
}: VehicleFormCardProps) {
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<VehicleFormValues>({
    mode: 'onTouched',
    // Editing shows the row as it stands, including the reading and the
    // description; a new visit starts those two blank.
    defaultValues: editing ? vehicleToFormValues(editing) : nextVisitFormValues(seed),
  })
  const { handleSubmit, reset, setError: setFieldError, setFocus } = form

  /** Both requests fail the same way, so they report it the same way. */
  const reportFailure = (err: unknown, fallback: string) => {
    setSaving(false)

    if (!(err instanceof ApiError)) {
      setError(fallback)
      return
    }

    // A 404 is the customer or the vehicle not belonging to this garage —
    // nothing the form can fix, so it stays in the banner.
    setError(err.message)
    applyVehicleApiError(err, setFieldError, setFocus)
  }

  const update = async (values: VehicleFormValues, vehicle: VehicleRecord) => {
    const patch = toUpdateVehiclePayload(values, vehicle)

    // "Send at least one field to update" — nothing was touched, so nothing
    // is sent.
    if (Object.keys(patch).length === 0) {
      toast('No changes to save', 'info')
      onCancel()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await vehicleService.updateVehicle(vehicle.id, patch)
      const saved = applyVehicleUpdate(vehicle, patch, updated)
      toast(`${saved.vehicleNumber || vehicle.vehicleNumber} updated`, 'success')
      onSaved(saved)
    } catch (err) {
      reportFailure(err, 'Could not update the vehicle. Please try again.')
      return
    }

    setSaving(false)
  }

  const create = async (values: VehicleFormValues) => {
    const payload = toCreateVehiclePayload(values, customerId)

    setSaving(true)
    setError(null)

    try {
      const vehicle = await vehicleService.createVehicle(payload)
      reset(nextVisitFormValues(seed))
      toast(`${vehicle.vehicleNumber || payload.vehicleNumber} added`, 'success')
      onSaved(vehicle)
    } catch (err) {
      reportFailure(err, 'Could not save the vehicle. Please try again.')
      return
    }

    setSaving(false)
  }

  const onSubmit = (values: VehicleFormValues) =>
    editing ? update(values, editing) : create(values)

  const title = editing
    ? `Edit ${editing.vehicleNumber || 'Vehicle'}`
    : seed
      ? `Book ${seed.vehicleNumber} in again`
      : customerName
        ? `Add vehicle for ${customerName}`
        : 'Add Vehicle'

  const subtitle = editing
    ? 'Change what is on file for this vehicle.'
    : seed
      ? 'The vehicle details are filled in — just add today’s reading and the work needed.'
      : 'Enter the number plate, pick the type and note the work needed.'

  return (
    <div id="vehicle-form" className="scroll-mt-20">
      <div className={hideHeading ? 'hidden' : 'mb-3'}>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <VehicleFields form={form} showStatus={Boolean(editing)} />

        {/* Stays in reach of the thumb on a phone, above the bottom bar. */}
        <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 mt-4 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur lg:bottom-4 sm:p-4">
          <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex sm:justify-end sm:gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              loading={saving}
              leftIcon={<Check className="h-4 w-4" />}
            >
              {editing ? 'Update Vehicle' : 'Save Vehicle'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
