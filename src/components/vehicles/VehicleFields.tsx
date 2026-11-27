import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Car,
  CarFront,
  CircleDot,
  ClipboardList,
  Gauge,
  Hash,
  Layers,
  Palette,
  Plus,
  Settings2,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { ChoiceChips, Input, Select, Textarea } from '@/components/ui'
import { FormSection } from '@/components/common/FormSection'
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

/** The jobs a garage writes down most — one tap adds them to "Work needed". */
const COMMON_WORK = [
  'General service',
  'Oil change',
  'Brake check',
  'Washing',
  'AC service',
  'Battery check',
  'Tyre / puncture',
  'Wheel alignment',
  'Engine noise',
  'Denting & painting',
]

interface VehicleFieldsProps {
  form: UseFormReturn<VehicleFormValues>
  /**
   * The status picker. A vehicle being booked in is always Pending (the job
   * card moves it on), so it is only offered when editing a saved vehicle.
   */
  showStatus?: boolean
}

/**
 * The vehicle fields, shared by adding and editing, in three plain groups:
 * the vehicle itself, the work it came in for, and the extras folded away.
 * Everything still maps to exactly what the API takes.
 */
export function VehicleFields({ form, showStatus = false }: VehicleFieldsProps) {
  const {
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = form

  const vehicleType = watch('vehicleType')
  const fuelType = watch('fuelType')
  const description = watch('description') ?? ''

  // A type saved before the current list (e.g. "Sedan") is still shown as picked.
  const typeOptions =
    vehicleType && !VEHICLE_TYPE_OPTIONS.some((o) => o.value === vehicleType)
      ? [...VEHICLE_TYPE_OPTIONS, { label: vehicleType, value: vehicleType }]
      : VEHICLE_TYPE_OPTIONS

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

  /** Adds a common job to the list, or takes it off again on a second tap. */
  const toggleWork = (job: string) => {
    const current = (getValues('description') ?? '').trim()
    const parts = current ? current.split(/\s*,\s*/) : []
    const has = parts.some((p) => p.toLowerCase() === job.toLowerCase())
    const next = has
      ? parts.filter((p) => p.toLowerCase() !== job.toLowerCase())
      : [...parts, job]
    setValue('description', next.join(', ').slice(0, DESCRIPTION_MAX_LENGTH), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const picked = description
    .split(/\s*,\s*/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)

  const extrasHaveError = Boolean(
    errors.brand ||
      errors.model ||
      errors.variant ||
      errors.color ||
      errors.insuranceExpiry ||
      errors.status,
  )

  return (
    <div className="space-y-4">
      <FormSection
        title="Vehicle"
        description="The number plate and type are all that is needed."
        icon={Car}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="order-1">
          <Input
            label="Vehicle Number *"
            placeholder="GJ01AB1234"
            className="h-12 text-base font-semibold uppercase tracking-wider"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={VEHICLE_NUMBER_MAX_LENGTH}
            hint="Type it as on the plate — no spaces needed"
            leftIcon={<Hash className="h-4 w-4" />}
            error={errors.vehicleNumber?.message}
            {...numberField}
            onChange={onNumberChange}
          />
          </div>

          <div className="order-3 md:order-2">
          <Input
            label="Current KM Reading"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 25000"
            hint="Optional — from the odometer"
            className="h-12 text-base"
            leftIcon={<Gauge className="h-4 w-4" />}
            error={errors.currentKm?.message}
            {...kmField}
            onChange={onKmChange}
          />
          </div>

          <div className="order-2 md:order-3 md:col-span-2">
            <ChoiceChips
              label="Vehicle Type *"
              options={typeOptions}
              selected={vehicleType}
              error={errors.vehicleType?.message}
              {...register('vehicleType', vehicleTypeRules)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Work needed"
        description="What did the customer ask for? Tap a common job or type your own."
        icon={ClipboardList}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {COMMON_WORK.map((job) => {
            const on = picked.includes(job.toLowerCase())
            return (
              <button
                key={job}
                type="button"
                onClick={() => toggleWork(job)}
                aria-pressed={on}
                className={cn(
                  'inline-flex min-h-[36px] items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors sm:text-sm',
                  on
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {!on && <Plus className="h-3.5 w-3.5" />}
                {job}
              </button>
            )
          })}
        </div>
        <Textarea
          label="Work / complaint *"
          placeholder="e.g. Engine noise while starting, general service due"
          maxLength={DESCRIPTION_MAX_LENGTH}
          leftIcon={<ClipboardList className="h-4 w-4" />}
          error={errors.description?.message}
          {...register('description', vehicleDescriptionRules)}
        />
      </FormSection>

      <FormSection
        title="More vehicle details"
        badge="Optional"
        description="Brand, model, fuel, colour and insurance — useful, but can wait."
        icon={Settings2}
        collapsible
        defaultOpen={showStatus}
        forceOpen={extrasHaveError}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            label="Brand"
            placeholder="e.g. Maruti, Hyundai, Honda"
            maxLength={BRAND_MAX_LENGTH}
            leftIcon={<Tag className="h-4 w-4" />}
            error={errors.brand?.message}
            {...register('brand', optionalBrandRules)}
          />

          <Input
            label="Model"
            placeholder="e.g. Swift, Creta, Activa"
            maxLength={MODEL_MAX_LENGTH}
            leftIcon={<CarFront className="h-4 w-4" />}
            error={errors.model?.message}
            {...register('model', optionalModelRules)}
          />

          <Input
            label="Variant"
            placeholder="e.g. VXI, SX"
            maxLength={VARIANT_MAX_LENGTH}
            leftIcon={<Layers className="h-4 w-4" />}
            error={errors.variant?.message}
            {...register('variant', optionalVariantRules)}
          />

          <Input
            label="Colour"
            placeholder="e.g. White"
            maxLength={COLOR_MAX_LENGTH}
            leftIcon={<Palette className="h-4 w-4" />}
            error={errors.color?.message}
            {...register('color', optionalColorRules)}
          />

          <Input
            label="Insurance Expiry"
            type="date"
            hint="We'll remind you before it runs out"
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            error={errors.insuranceExpiry?.message}
            {...register('insuranceExpiry', insuranceExpiryRules)}
          />

          {showStatus && (
            <Select
              label="Status"
              options={VEHICLE_STATUS_OPTIONS}
              leftIcon={<CircleDot className="h-4 w-4" />}
              error={errors.status?.message}
              {...register('status')}
            />
          )}

          <div className="md:col-span-2 xl:col-span-3">
            <FuelChips form={form} selected={fuelType} />
          </div>
        </div>
      </FormSection>
    </div>
  )
}

/** Fuel as one-tap chips; tapping the picked one again clears it (it is optional). */
function FuelChips({
  form,
  selected,
}: {
  form: UseFormReturn<VehicleFormValues>
  selected: string
}) {
  const { setValue, register } = form
  return (
    <div>
      <input type="hidden" {...register('fuelType')} />
      <p className="mb-1.5 block text-sm font-medium text-slate-700">Fuel Type</p>
      <div className="flex flex-wrap gap-2">
        {FUEL_TYPE_OPTIONS.map((o) => {
          const on = selected === o.value
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setValue('fuelType', on ? '' : o.value, { shouldDirty: true })
              }
              className={cn(
                'inline-flex min-h-[40px] items-center rounded-lg border px-3.5 text-sm font-medium transition-colors',
                on
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
