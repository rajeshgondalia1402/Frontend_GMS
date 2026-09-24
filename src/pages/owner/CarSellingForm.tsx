import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import type { ChangeEvent, ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Fuel,
  Hash,
  IndianRupee,
  MapPin,
  Palette,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, ErrorState, Input, LoadingState, Select, Textarea, useToast } from '@/components/ui'
import { SectionCard } from '@/components/jobcards/SectionCard'
import { SuggestionCombobox } from '@/components/carSelling'
import { carSellingService } from '@/services/carSellingService'
import { ApiError } from '@/services/httpClient'
import {
  CAR_COMPANIES,
  CAR_TYPES,
  EMPTY_CAR_SELLING_FORM,
  applyCarSellingApiError,
  carOwnerOptions,
  carSellingFormValues,
  fuelTypeOptions,
  isInsuranceExpired,
  toDateInput,
  todayDateInput,
  toCreateCarSellingPayload,
  toUpdateCarSellingPayload,
} from '@/lib/carSelling'
import type { CarSellingFormValues } from '@/lib/carSelling'
import {
  CAR_ADDRESS_MAX_LENGTH,
  CAR_COLOR_MAX_LENGTH,
  CAR_COMPANY_MAX_LENGTH,
  CAR_DESCRIPTION_MAX_LENGTH,
  CAR_OWNER_NAME_MAX_LENGTH,
  CAR_TYPE_MAX_LENGTH,
  CAR_YEAR_MIN,
  MOBILE_LENGTH,
  VEHICLE_NUMBER_MAX_LENGTH,
  carNumberRules,
  carOwnerNameRules,
  carYearMax,
  fuelTypeRules,
  insuranceExpiryRules,
  mobileNumberRules,
  normalizeMobileInput,
  normalizeVehicleNumber,
  optionalCarAddressRules,
  optionalCarColorRules,
  optionalCarCompanyRules,
  optionalCarDescriptionRules,
  optionalCarTypeRules,
  sellingPriceRules,
  yearOfVehicleRules,
} from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { CarSellingRecord } from '@/types/carSelling'

const LIST_PATH = '/app/car-selling'

interface FlagOptionProps {
  label: string
  hint: string
  icon: ReactNode
  /** Accidental is the one flag that counts against the car. */
  danger?: boolean
  children: ReactNode
}

/** A whole tappable tile around the checkbox — easier to hit on a phone. */
function FlagOption({ label, hint, icon, danger, children }: FlagOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer select-none items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50',
        danger
          ? 'has-[:checked]:border-red-300 has-[:checked]:bg-red-50'
          : 'has-[:checked]:border-primary-300 has-[:checked]:bg-primary-50',
      )}
    >
      {children}
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
          {icon}
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  )
}

/**
 * Adds a car for sale (`/app/car-selling/new`) or edits one
 * (`/app/car-selling/:id/edit`). Editing sends only what changed.
 *
 * The list hands the row over in the navigation state so the form opens filled
 * in at once; opened from a bookmark or a refresh, the car is read from
 * `GET /api/auth/car-selling/:id` instead.
 */
export function CarSellingForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { toast } = useToast()
  const isEdit = Boolean(id)

  const handed = (location.state as { car?: CarSellingRecord } | null)?.car
  const [car, setCar] = useState<CarSellingRecord | null>(
    handed && handed.id === id ? handed : null,
  )
  const [loadingCar, setLoadingCar] = useState(isEdit && !car)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    setFocus,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<CarSellingFormValues>({
    mode: 'onTouched',
    defaultValues: car ? carSellingFormValues(car) : EMPTY_CAR_SELLING_FORM,
  })

  // Opened by its address alone, the car being edited has to be read first.
  useEffect(() => {
    if (!isEdit || !id || car) return
    let cancelled = false

    setLoadingCar(true)
    setLoadError(null)
    carSellingService
      .getCarSelling(id)
      .then((data) => {
        if (cancelled) return
        setCar(data)
        reset(carSellingFormValues(data))
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof ApiError ? err.message : 'Could not load this car.')
      })
      .finally(() => {
        if (!cancelled) setLoadingCar(false)
      })

    return () => {
      cancelled = true
    }
  }, [isEdit, id, car, reset])

  const backToList = () => navigate(LIST_PATH)

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeMobileInput(e.target.value)
    void mobileField.onChange(e)
  }

  const carNumberField = register('carNumber', carNumberRules)

  // Show exactly what the API will store: uppercase, no spaces or hyphens.
  const onCarNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeVehicleNumber(e.target.value)
    void carNumberField.onChange(e)
  }

  const insurance = watch('insurance')
  const insuranceExpired = isInsuranceExpired(watch('insuranceDate'))

  const insuranceField = register('insurance')
  const today = todayDateInput()
  // A car being edited may already carry a lapsed date; it can be kept as is,
  // but any newly picked date has to be today or later.
  const savedInsuranceDate = toDateInput(car?.insuranceDate)
  const insuranceDateField = register('insuranceDate', {
    validate: (value: string) => {
      const valid = insuranceExpiryRules.validate(value)
      if (valid !== true) return valid
      const date = (value ?? '').trim()
      if (date && date < todayDateInput() && date !== savedInsuranceDate) {
        return 'Insurance date cannot be in the past'
      }
      return true
    },
  })
  const insuranceDateRef = useRef<HTMLInputElement | null>(null)
  /** Set by ticking Insurance; the date box opens its calendar once it is drawn. */
  const calendarPending = useRef(false)

  const openCalendar = () => {
    const input = insuranceDateRef.current
    if (!input) return
    input.focus()
    try {
      input.showPicker()
    } catch {
      // Older browsers have no showPicker(); the focused box is the fallback.
    }
  }

  /**
   * Ticking Insurance opens the calendar for its date; unticking it clears the
   * date, since an uninsured car has nothing to be valid until.
   */
  const onInsuranceChange = (e: ChangeEvent<HTMLInputElement>) => {
    void insuranceField.onChange(e)
    if (e.target.checked) {
      calendarPending.current = true
    } else {
      setValue('insuranceDate', '')
      clearErrors('insuranceDate')
    }
  }

  // The date box only exists after the render that ticking causes.
  useEffect(() => {
    if (!insurance || !calendarPending.current) return
    calendarPending.current = false
    openCalendar()
  }, [insurance])

  const onSubmit = async (values: CarSellingFormValues) => {
    setSaving(true)
    setError(null)

    try {
      if (car) {
        const payload = toUpdateCarSellingPayload(values, car)
        // The API rejects an empty body; nothing changed is simply done.
        if (Object.keys(payload).length === 0) {
          toast('No changes to save', 'info')
          backToList()
          return
        }
        await carSellingService.updateCarSelling(car.id, payload)
      } else {
        await carSellingService.createCarSelling(toCreateCarSellingPayload(values))
      }
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError(
          car
            ? 'Could not update the car. Please try again.'
            : 'Could not add the car. Please try again.',
        )
        return
      }

      setError(err.message)
      applyCarSellingApiError(err, setFieldError, setFocus)
      return
    }

    toast(car ? 'Car details updated' : 'Car added for sale', 'success')
    // The list reads itself again on the way back, so the car is in its place.
    backToList()
  }

  const yearMax = carYearMax()

  const backLink = (
    <button
      type="button"
      onClick={backToList}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Car Selling
    </button>
  )

  if (isEdit && (loadingCar || loadError || !car)) {
    return (
      <div>
        {backLink}
        {loadError ? (
          <ErrorState
            title="Could not load this car"
            description={loadError}
            onRetry={() => navigate(0)}
          />
        ) : (
          <LoadingState />
        )}
      </div>
    )
  }

  return (
    <div>
      {backLink}

      <PageHeader
        title={isEdit ? 'Edit Car for Sale' : 'Add Car for Sale'}
        subtitle={
          isEdit
            ? 'Update the details of this listing'
            : 'Put a used car on your garage’s selling list'
        }
      />

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
        {/* Each section fills the width it is given, so the page stays short:
            one row of seller details, two of car details, one of papers. */}
        <SectionCard icon={User} title="Seller Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Owner Name *"
              placeholder="Rahul Patel"
              autoComplete="name"
              maxLength={CAR_OWNER_NAME_MAX_LENGTH}
              leftIcon={<User className="h-4 w-4" />}
              error={errors.ownerName?.message}
              {...register('ownerName', carOwnerNameRules)}
            />
            <Input
              label="Mobile Number *"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="9876543210"
              maxLength={MOBILE_LENGTH}
              leftIcon={<Phone className="h-4 w-4" />}
              error={errors.mobileNumber?.message}
              {...mobileField}
              onChange={onMobileChange}
            />
            <Input
              label="Address"
              placeholder="Satellite, Ahmedabad"
              autoComplete="street-address"
              maxLength={CAR_ADDRESS_MAX_LENGTH}
              leftIcon={<MapPin className="h-4 w-4" />}
              error={errors.address?.message}
              {...register('address', optionalCarAddressRules)}
            />
          </div>
        </SectionCard>

        <SectionCard icon={CarFront} title="Car & Price" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Car Number *"
              placeholder="GJ01AB1234"
              className="uppercase"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={VEHICLE_NUMBER_MAX_LENGTH}
              hint="No spaces or hyphens"
              leftIcon={<Hash className="h-4 w-4" />}
              error={errors.carNumber?.message}
              {...carNumberField}
              onChange={onCarNumberChange}
            />
            <Controller
              control={control}
              name="companyName"
              rules={optionalCarCompanyRules}
              render={({ field }) => (
                <SuggestionCombobox
                  label="Company"
                  name={field.name}
                  placeholder="Search or type a company"
                  maxLength={CAR_COMPANY_MAX_LENGTH}
                  leftIcon={<Building2 className="h-4 w-4" />}
                  suggestions={CAR_COMPANIES}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.companyName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="carType"
              rules={optionalCarTypeRules}
              render={({ field }) => (
                <SuggestionCombobox
                  label="Car Name"
                  name={field.name}
                  placeholder="Search or type a car name"
                  maxLength={CAR_TYPE_MAX_LENGTH}
                  leftIcon={<CarFront className="h-4 w-4" />}
                  suggestions={CAR_TYPES}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.carType?.message}
                />
              )}
            />
            <Input
              label="Year of Vehicle"
              type="number"
              inputMode="numeric"
              min={CAR_YEAR_MIN}
              max={yearMax}
              step={1}
              placeholder={String(yearMax - 5)}
              leftIcon={<CalendarDays className="h-4 w-4" />}
              error={errors.yearOfVehicle?.message}
              {...register('yearOfVehicle', yearOfVehicleRules)}
            />
            <Select
              label="Fuel Type *"
              placeholder="Select fuel type"
              options={fuelTypeOptions}
              leftIcon={<Fuel className="h-4 w-4" />}
              error={errors.fuelType?.message}
              {...register('fuelType', fuelTypeRules)}
            />
            <Input
              label="Car Color"
              placeholder="White"
              maxLength={CAR_COLOR_MAX_LENGTH}
              leftIcon={<Palette className="h-4 w-4" />}
              error={errors.carColor?.message}
              {...register('carColor', optionalCarColorRules)}
            />
            <Select
              label="Ownership"
              placeholder="Select owners"
              options={carOwnerOptions(car?.carOwner)}
              leftIcon={<Users className="h-4 w-4" />}
              error={errors.carOwner?.message}
              {...register('carOwner')}
            />
            <Input
              label="Selling Price *"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="425000"
              leftIcon={<IndianRupee className="h-4 w-4" />}
              error={errors.sellingPrice?.message}
              {...register('sellingPrice', sellingPriceRules)}
            />
          </div>
        </SectionCard>

        <SectionCard icon={ClipboardCheck} title="Papers & Condition" className="mt-4">
          {/* The three tiles and the insurance date share one row, so ticking
              Insurance fills the space beside them instead of adding a row. */}
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FlagOption
              label="PUC"
              hint="Valid pollution certificate"
              icon={<FileCheck2 className="h-4 w-4 text-slate-400" />}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary-600"
                {...register('puc')}
              />
            </FlagOption>
            <FlagOption
              danger
              label="Accidental"
              hint="Car has been in an accident"
              icon={<AlertTriangle className="h-4 w-4 text-slate-400" />}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-red-600"
                {...register('isAccidental')}
              />
            </FlagOption>
            <FlagOption
              label="Insurance"
              hint="Valid insurance"
              icon={<ShieldCheck className="h-4 w-4 text-slate-400" />}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary-600"
                {...insuranceField}
                onChange={onInsuranceChange}
              />
            </FlagOption>

            {/* Only an insured car has a date its insurance runs until. */}
            {insurance && (
              // Drawn as a tile like the three beside it, so the row lines up.
              <div
                className={cn(
                  'animate-fade-in rounded-lg border bg-white p-3',
                  errors.insuranceDate ? 'border-red-300' : 'border-slate-200',
                )}
              >
                <label
                  htmlFor="insuranceDate"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-800"
                >
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Insurance Valid Till
                </label>
                <input
                  id="insuranceDate"
                  type="date"
                  min={today}
                  className="mt-1.5 h-8 w-full cursor-pointer rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  {...insuranceDateField}
                  ref={(el) => {
                    insuranceDateField.ref(el)
                    insuranceDateRef.current = el
                  }}
                  // Clicking anywhere in the box opens the calendar, not just the icon.
                  onClick={() => openCalendar()}
                />
                <p
                  className={cn(
                    'mt-1 text-xs',
                    errors.insuranceDate ? 'text-red-600' : 'text-slate-500',
                  )}
                >
                  {errors.insuranceDate?.message ??
                    (insuranceExpired ? 'This date has passed' : 'Optional')}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Textarea
              label="Description"
              rows={2}
              placeholder="Single owner, all services done at the company workshop."
              maxLength={CAR_DESCRIPTION_MAX_LENGTH}
              leftIcon={<FileText className="h-4 w-4" />}
              error={errors.description?.message}
              {...register('description', optionalCarDescriptionRules)}
            />
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="sm:w-auto"
            disabled={saving}
            onClick={backToList}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth className="sm:w-auto" loading={saving}>
            {isEdit ? 'Update Car' : 'Save Car'}
          </Button>
        </div>
      </form>
    </div>
  )
}
