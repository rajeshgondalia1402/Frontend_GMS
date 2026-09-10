import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { Button, Card, useToast } from '@/components/ui'
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
}

export function VehicleFormCard({
  customerId,
  seed,
  editing,
  onSaved,
  onCancel,
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

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">
        {editing ? 'Edit Vehicle' : 'Vehicle Details'}
      </h2>
      <p className="mt-0.5 text-sm text-slate-500">
        {editing
          ? 'Change what is on file for this vehicle.'
          : 'Add the vehicle this customer is bringing in.'}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4">
        <VehicleFields form={form} columns={3} />

        <div className="mt-5 flex gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="sm:w-auto sm:flex-none"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth className="sm:w-auto sm:flex-none" loading={saving}>
            {editing ? 'Update Vehicle' : 'Save Vehicle'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
