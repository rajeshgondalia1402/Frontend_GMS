import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { Button, Card, Input, Select, Textarea, useToast } from '@/components/ui'
import { vehicleService } from '@/services/vehicleService'
import { ApiError } from '@/services/httpClient'
import { VEHICLE_STATUS_OPTIONS } from '@/lib/vehicleStatus'
import {
  BRAND_MAX_LENGTH,
  COLOR_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  MODEL_MAX_LENGTH,
  VARIANT_MAX_LENGTH,
  VEHICLE_NUMBER_MAX_LENGTH,
  currentKmRules,
  digitsOnly,
  insuranceExpiryRules,
  normalizeVehicleNumber,
  optionalBrandRules,
  optionalColorRules,
  optionalModelRules,
  optionalVariantRules,
  vehicleDescriptionRules,
  vehicleNumberRules,
  vehicleTypeRules,
} from '@/lib/validation'
import type { CreateVehiclePayload, VehicleRecord, VehicleStatus } from '@/types/vehicle'

interface VehicleFormValues {
  vehicleNumber: string
  vehicleType: string
  description: string
  /** Kept as text so the field can be empty and digits-only while typing. */
  currentKm: string
  brand: string
  model: string
  variant: string
  fuelType: string
  color: string
  insuranceExpiry: string
  status: VehicleStatus
}

const EMPTY: VehicleFormValues = {
  vehicleNumber: '',
  vehicleType: '',
  description: '',
  currentKm: '',
  brand: '',
  model: '',
  variant: '',
  fuelType: '',
  color: '',
  insuranceExpiry: '',
  // The API defaults to PENDING when no status is sent.
  status: 'PENDING',
}

const VEHICLE_TYPE_OPTIONS = [
  'Car',
  'Bike',
  'Scooter',
  'Auto Rickshaw',
  'Truck',
  'Bus',
  'Tractor',
  'Other',
].map((t) => ({ label: t, value: t }))

const FUEL_TYPE_OPTIONS = ['Petrol', 'Diesel', 'CNG', 'LPG', 'Electric', 'Hybrid'].map((f) => ({
  label: f,
  value: f,
}))

/** Fields the API can report a validation error against. */
const FORM_FIELDS: string[] = [
  'vehicleNumber',
  'vehicleType',
  'description',
  'currentKm',
  'brand',
  'model',
  'variant',
  'fuelType',
  'color',
  'insuranceExpiry',
  'status',
]

interface AddVehicleFormProps {
  customerId: string
  /** Hands the created row back so the page can list it. */
  onCreated: (vehicle: VehicleRecord) => void
  onCancel: () => void
}

export function AddVehicleForm({ customerId, onCreated, onCancel }: AddVehicleFormProps) {
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    setFocus,
    formState: { errors },
  } = useForm<VehicleFormValues>({ mode: 'onTouched', defaultValues: EMPTY })

  const numberField = register('vehicleNumber', vehicleNumberRules)
  const kmField = register('currentKm', currentKmRules)

  // Show exactly what the API will store: uppercase, no spaces or hyphens.
  const onNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeVehicleNumber(e.target.value)
    void numberField.onChange(e)
  }

  const onKmChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = digitsOnly(e.target.value)
    void kmField.onChange(e)
  }

  const onSubmit = async (values: VehicleFormValues) => {
    const payload: CreateVehiclePayload = {
      customerId,
      vehicleNumber: normalizeVehicleNumber(values.vehicleNumber),
      vehicleType: values.vehicleType.trim(),
      description: values.description.trim(),
      currentKm: Number(values.currentKm.trim()),
      status: values.status,
    }

    // Optional fields are left out entirely rather than sent empty.
    const optional: Pick<
      CreateVehiclePayload,
      'brand' | 'model' | 'variant' | 'fuelType' | 'color' | 'insuranceExpiry'
    > = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      variant: values.variant.trim(),
      fuelType: values.fuelType.trim(),
      color: values.color.trim(),
      insuranceExpiry: values.insuranceExpiry.trim(),
    }
    for (const [key, value] of Object.entries(optional)) {
      if (value) payload[key as keyof typeof optional] = value
    }

    setSaving(true)
    setError(null)

    try {
      const vehicle = await vehicleService.createVehicle(payload)
      reset(EMPTY)
      toast(`${vehicle.vehicleNumber || payload.vehicleNumber} added`, 'success')
      onCreated(vehicle)
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError('Could not save the vehicle. Please try again.')
        return
      }

      // 404 means the customer does not belong to this garage — nothing the
      // form can fix, so it stays in the banner.
      setError(err.message)

      for (const { field, message } of err.fieldErrors) {
        if (FORM_FIELDS.includes(field)) {
          setFieldError(field as keyof VehicleFormValues, { type: 'server', message })
        }
      }

      const firstRejected = err.fieldErrors.find((e) => FORM_FIELDS.includes(e.field))
      if (firstRejected) setFocus(firstRejected.field as keyof VehicleFormValues)
      return
    }

    setSaving(false)
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Vehicle Details</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Add the vehicle this customer is bringing in.
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Vehicle Number *"
            placeholder="GJ01AB1234"
            className="uppercase"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={VEHICLE_NUMBER_MAX_LENGTH}
            hint="Spaces and hyphens are removed"
            error={errors.vehicleNumber?.message}
            {...numberField}
            onChange={onNumberChange}
          />

          <Select
            label="Vehicle Type *"
            placeholder="Select type"
            options={VEHICLE_TYPE_OPTIONS}
            error={errors.vehicleType?.message}
            {...register('vehicleType', vehicleTypeRules)}
          />

          <Input
            label="Brand"
            placeholder="Hyundai"
            maxLength={BRAND_MAX_LENGTH}
            error={errors.brand?.message}
            {...register('brand', optionalBrandRules)}
          />

          <Input
            label="Model"
            placeholder="Creta"
            maxLength={MODEL_MAX_LENGTH}
            error={errors.model?.message}
            {...register('model', optionalModelRules)}
          />

          <Input
            label="Variant"
            placeholder="SX"
            maxLength={VARIANT_MAX_LENGTH}
            error={errors.variant?.message}
            {...register('variant', optionalVariantRules)}
          />

          <Select
            label="Fuel Type"
            placeholder="Select fuel"
            options={FUEL_TYPE_OPTIONS}
            {...register('fuelType')}
          />

          <Input
            label="Colour"
            placeholder="White"
            maxLength={COLOR_MAX_LENGTH}
            error={errors.color?.message}
            {...register('color', optionalColorRules)}
          />

          <Input
            label="Current KM *"
            type="text"
            inputMode="numeric"
            placeholder="25000"
            error={errors.currentKm?.message}
            {...kmField}
            onChange={onKmChange}
          />

          <Input
            label="Insurance Expiry"
            type="date"
            hint="Optional"
            error={errors.insuranceExpiry?.message}
            {...register('insuranceExpiry', insuranceExpiryRules)}
          />

          <Select
            label="Status"
            options={VEHICLE_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Description *"
              placeholder="White Hyundai Creta"
              maxLength={DESCRIPTION_MAX_LENGTH}
              error={errors.description?.message}
              {...register('description', vehicleDescriptionRules)}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="lg:w-auto lg:flex-none"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={saving}>
            Save Vehicle
          </Button>
        </div>
      </form>
    </Card>
  )
}
