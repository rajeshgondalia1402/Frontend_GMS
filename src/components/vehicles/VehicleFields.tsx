import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Car,
  CarFront,
  CircleDot,
  FileText,
  Fuel,
  Gauge,
  Hash,
  Layers,
  Palette,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { VEHICLE_STATUS_OPTIONS } from '@/lib/vehicleStatus'
import { FUEL_TYPE_OPTIONS, VEHICLE_TYPE_OPTIONS } from '@/lib/vehicleForm'
import type { VehicleFormValues } from '@/lib/vehicleForm'
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

interface VehicleFieldsProps {
  form: UseFormReturn<VehicleFormValues>
  /** Three across the full page; fewer where the form is narrower. */
  columns?: 1 | 2 | 3
}

const GRID = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

/**
 * The vehicle fields, shared by the two modes of the form so adding and
 * editing collect exactly what the API takes and normalise it the same way.
 */
export function VehicleFields({ form, columns = 3 }: VehicleFieldsProps) {
  const {
    register,
    formState: { errors },
  } = form

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

  return (
    <div className={cn('grid gap-4', GRID[columns])}>
      <Input
        label="Vehicle Number *"
        placeholder="GJ01AB1234"
        className="uppercase"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={VEHICLE_NUMBER_MAX_LENGTH}
        hint="Spaces and hyphens are removed"
        leftIcon={<Hash className="h-4 w-4" />}
        error={errors.vehicleNumber?.message}
        {...numberField}
        onChange={onNumberChange}
      />

      <Select
        label="Vehicle Type *"
        placeholder="Select type"
        options={VEHICLE_TYPE_OPTIONS}
        leftIcon={<Car className="h-4 w-4" />}
        error={errors.vehicleType?.message}
        {...register('vehicleType', vehicleTypeRules)}
      />

      <Input
        label="Brand"
        placeholder="Hyundai"
        maxLength={BRAND_MAX_LENGTH}
        leftIcon={<Tag className="h-4 w-4" />}
        error={errors.brand?.message}
        {...register('brand', optionalBrandRules)}
      />

      <Input
        label="Model"
        placeholder="Creta"
        maxLength={MODEL_MAX_LENGTH}
        leftIcon={<CarFront className="h-4 w-4" />}
        error={errors.model?.message}
        {...register('model', optionalModelRules)}
      />

      <Input
        label="Variant"
        placeholder="SX"
        maxLength={VARIANT_MAX_LENGTH}
        leftIcon={<Layers className="h-4 w-4" />}
        error={errors.variant?.message}
        {...register('variant', optionalVariantRules)}
      />

      <Select
        label="Fuel Type"
        placeholder="Select fuel"
        options={FUEL_TYPE_OPTIONS}
        leftIcon={<Fuel className="h-4 w-4" />}
        {...register('fuelType')}
      />

      <Input
        label="Colour"
        placeholder="White"
        maxLength={COLOR_MAX_LENGTH}
        leftIcon={<Palette className="h-4 w-4" />}
        error={errors.color?.message}
        {...register('color', optionalColorRules)}
      />

      <Input
        label="Current KM"
        type="text"
        inputMode="numeric"
        placeholder="25000"
        hint="Optional"
        leftIcon={<Gauge className="h-4 w-4" />}
        error={errors.currentKm?.message}
        {...kmField}
        onChange={onKmChange}
      />

      <Input
        label="Insurance Expiry"
        type="date"
        hint="Optional"
        leftIcon={<ShieldCheck className="h-4 w-4" />}
        error={errors.insuranceExpiry?.message}
        {...register('insuranceExpiry', insuranceExpiryRules)}
      />

      <Select
        label="Status"
        options={VEHICLE_STATUS_OPTIONS}
        leftIcon={<CircleDot className="h-4 w-4" />}
        error={errors.status?.message}
        {...register('status')}
      />

      <div className={columns === 1 ? '' : 'md:col-span-2'}>
        <Textarea
          label="Description *"
          placeholder="White Hyundai Creta"
          maxLength={DESCRIPTION_MAX_LENGTH}
          leftIcon={<FileText className="h-4 w-4" />}
          error={errors.description?.message}
          {...register('description', vehicleDescriptionRules)}
        />
      </div>
    </div>
  )
}
