import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { ChangeEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CarFront,
  IndianRupee,
  MapPin,
  Phone,
  Truck,
  User,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, ErrorState, Input, LoadingState, Select, useToast } from '@/components/ui'
import { SectionCard } from '@/components/jobcards/SectionCard'
import { CarPickerInput, SelectedCarDetails } from '@/components/carSold'
import { carSoldService } from '@/services/carSoldService'
import { ApiError } from '@/services/httpClient'
import {
  DELIVERED_STATUS_OPTIONS,
  EMPTY_CAR_SOLD_FORM,
  amountLabel,
  applyCarSoldApiError,
  carSoldFormValues,
  paysOffThePrice,
  toCreateCarSoldPayload,
  toUpdateCarSoldPayload,
} from '@/lib/carSold'
import type { CarSoldFormValues } from '@/lib/carSold'
import { todayDateInput } from '@/lib/carSelling'
import {
  MOBILE_LENGTH,
  PURCHASE_OWNER_ADDRESS_MAX_LENGTH,
  PURCHASE_OWNER_NAME_MAX_LENGTH,
  carSoldCarRules,
  carSoldPaymentRules,
  deliveredDateRules,
  finalSellingPriceRules,
  mobileNumberRules,
  normalizeMobileInput,
  optionalPurchaseOwnerAddressRules,
  purchaseOwnerNameRules,
} from '@/lib/validation'
import type { CarSellingOption, SoldCarRecord } from '@/types/carSold'
import type { CarSellingRecord } from '@/types/carSelling'

const LIST_PATH = '/app/car-sold'

/**
 * Sells a listed car on (`/app/car-sold/new`): pick the car, check who is
 * selling it, then record the buyer and the deal.
 *
 * A listing can only be sold once — a second sale comes back 409, which is
 * shown as it is rather than as a generic failure.
 *
 * Also corrects a recorded sale (`/app/car-sold/:id/edit`, `:id` being the
 * sale's id). The list hands the row over in the navigation state so the form
 * opens filled in at once; opened from a bookmark or a refresh, the sale is read
 * from `GET /api/auth/car-selling/sold-customer/:id` instead. The car and the
 * money are fixed here: a sale stays on its car, and later payments go through
 * Collect.
 */
export function CarSoldForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { toast } = useToast()
  const isEdit = Boolean(id)

  const handed = (location.state as { car?: SoldCarRecord } | null)?.car
  const [editing, setEditing] = useState<SoldCarRecord | null>(
    isEdit && handed && handed.soldCustomerDetail?.id === id ? handed : null,
  )
  const sale = editing?.soldCustomerDetail ?? null
  const [loadingSale, setLoadingSale] = useState(isEdit && !editing)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Bumped by Retry to read the sale again. */
  const [loadAttempt, setLoadAttempt] = useState(0)

  const [picked, setPicked] = useState<CarSellingOption | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    clearErrors,
    setError: setFieldError,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<CarSoldFormValues>({
    mode: 'onTouched',
    defaultValues: sale ? carSoldFormValues(sale) : EMPTY_CAR_SOLD_FORM,
  })

  // Opened by its address alone, the sale being edited has to be read first.
  useEffect(() => {
    if (!isEdit || !id || editing) return
    let cancelled = false

    setLoadingSale(true)
    setLoadError(null)
    carSoldService
      .getSoldCar(id)
      .then((car) => {
        if (cancelled) return
        if (!car.soldCustomerDetail) {
          setLoadError('Could not load this sale.')
          return
        }
        setEditing(car)
        reset(carSoldFormValues(car.soldCustomerDetail))
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof ApiError ? err.message : 'Could not load this sale.')
      })
      .finally(() => {
        if (!cancelled) setLoadingSale(false)
      })

    return () => {
      cancelled = true
    }
  }, [isEdit, id, editing, reset, loadAttempt])

  const carSellingId = watch('carSellingId')
  const deliveredStatus = watch('deliveredStatus')
  const finalSellingPrice = watch('finalSellingPrice')
  const paymentAmount = watch('paymentAmount')

  const paidInFull = paysOffThePrice({ paymentAmount, finalSellingPrice })
  // The date is asked for only when the desk marks the car Delivered.
  const showDeliveredDate = deliveredStatus === 'DELIVERED'

  const onCarPicked = (car: CarSellingOption | null) => {
    setPicked(car)
    setValue('carSellingId', car?.id ?? '', { shouldValidate: Boolean(car) })
    setError(null)
  }

  /**
   * The asking price is what the deal usually closes at, so it is offered as
   * the final price — only while the field is still untouched, so a figure the
   * desk has already typed is never overwritten.
   */
  const onCarLoaded = useCallback(
    (car: CarSellingRecord) => {
      setValue('finalSellingPrice', car.sellingPrice === null ? '' : String(car.sellingPrice))
    },
    [setValue],
  )

  /** On an edit the price may not drop below what the buyer has already paid. */
  const priceRules = sale
    ? {
        ...finalSellingPriceRules,
        validate: (value: string) => {
          const valid = finalSellingPriceRules.validate(value)
          if (valid !== true) return valid
          return Number(value.trim()) >= sale.paidAmount
            ? true
            : `Cannot be less than the ${amountLabel(sale.paidAmount)} already paid`
        },
      }
    : finalSellingPriceRules

  const mobileField = register('purchaseOwnerMobileNo', mobileNumberRules)

  const onMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeMobileInput(e.target.value)
    void mobileField.onChange(e)
  }

  const deliveredField = register('deliveredStatus')

  /**
   * Marking the car Delivered fills in today as its delivery date; a sale put
   * back to Pending has no delivery date to keep.
   */
  const onDeliveredChange = (e: ChangeEvent<HTMLSelectElement>) => {
    void deliveredField.onChange(e)
    if (e.target.value === 'DELIVERED') {
      // A date the sale already had is kept rather than replaced with today.
      if (!getValues('deliveredDate')) setValue('deliveredDate', todayDateInput())
    } else {
      setValue('deliveredDate', '')
      clearErrors('deliveredDate')
    }
  }

  const backToList = () => navigate(LIST_PATH)

  const onSubmit = async (values: CarSoldFormValues) => {
    setSaving(true)
    setError(null)

    try {
      if (sale) {
        await carSoldService.updateCarSoldCustomer(sale.id, toUpdateCarSoldPayload(values))
      } else {
        await carSoldService.createCarSoldCustomer(
          values.carSellingId,
          toCreateCarSoldPayload(values),
        )
      }
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError('Could not save this sale. Please try again.')
        return
      }

      setError(err.message)
      applyCarSoldApiError(err, setFieldError, setFocus)
      // The car is gone from the picker either way — sold by someone else, or
      // deleted — so the field is where the desk has to start again.
      if (!sale && (err.status === 409 || err.status === 404)) setFocus('carSellingId')
      return
    }

    toast(sale ? 'Car sale updated' : 'Car sale recorded', 'success')
    backToList()
  }

  if (isEdit && !sale) {
    return (
      <div>
        <PageHeader title="Edit Car Sold" />
        {loadError ? (
          <ErrorState
            title="Could not load this sale"
            description={loadError}
            onRetry={() => setLoadAttempt((n) => n + 1)}
          />
        ) : (
          loadingSale && <LoadingState />
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={backToList}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Car Sold Detail
      </button>

      <PageHeader
        title={sale ? 'Edit Car Sold' : 'Add Car Sold'}
        subtitle={
          sale
            ? 'Correct the buyer, the final price or the delivery'
            : 'Record who bought a car from the selling board'
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
        <SectionCard icon={CarFront} title="Car Sold">
          {/* The id is what the POST's URL is built from; the picker sets it. */}
          <input type="hidden" {...register('carSellingId', sale ? {} : carSoldCarRules)} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {editing ? (
              // A sale stays on the car it was recorded against.
              <Input
                label="Car"
                value={[editing.carNumber, editing.carType].filter(Boolean).join(' · ')}
                readOnly
                disabled
                hint="The car of a recorded sale can't be changed"
                leftIcon={<CarFront className="h-4 w-4" />}
              />
            ) : (
              <CarPickerInput
                value={picked}
                onPick={onCarPicked}
                error={errors.carSellingId?.message}
              />
            )}
            <Input
              label="Final Selling Price *"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="400000"
              hint={
                sale && sale.paidAmount > 0
                  ? `${amountLabel(sale.paidAmount)} already paid`
                  : 'What the car actually went for'
              }
              leftIcon={<IndianRupee className="h-4 w-4" />}
              error={errors.finalSellingPrice?.message}
              {...register('finalSellingPrice', priceRules)}
            />
            <Select
              label="Delivered Status"
              options={DELIVERED_STATUS_OPTIONS}
              leftIcon={<Truck className="h-4 w-4" />}
              error={errors.deliveredStatus?.message}
              {...deliveredField}
              onChange={onDeliveredChange}
            />
          </div>

          <div className="mt-4">
            {/* On an edit the price is the deal's, so the asking price is not offered. */}
            <SelectedCarDetails
              carSellingId={carSellingId}
              onLoaded={sale ? undefined : onCarLoaded}
            />
          </div>
        </SectionCard>

        <SectionCard icon={User} title="Buyer Details" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Buyer Name *"
              placeholder="Amit Shah"
              autoComplete="name"
              maxLength={PURCHASE_OWNER_NAME_MAX_LENGTH}
              leftIcon={<User className="h-4 w-4" />}
              error={errors.purchaseOwnerName?.message}
              {...register('purchaseOwnerName', purchaseOwnerNameRules)}
            />
            <Input
              label="Buyer Mobile Number *"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="9812345678"
              maxLength={MOBILE_LENGTH}
              leftIcon={<Phone className="h-4 w-4" />}
              error={errors.purchaseOwnerMobileNo?.message}
              {...mobileField}
              onChange={onMobileChange}
            />
            <Input
              label="Buyer Address"
              placeholder="Vastrapur, Ahmedabad"
              autoComplete="street-address"
              maxLength={PURCHASE_OWNER_ADDRESS_MAX_LENGTH}
              leftIcon={<MapPin className="h-4 w-4" />}
              error={errors.purchaseOwnerAddress?.message}
              {...register('purchaseOwnerAddress', optionalPurchaseOwnerAddressRules)}
            />

            {/* Money on a recorded sale only moves through Collect. */}
            {!sale && (
              <Input
                label="Payment Received *"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="100000"
                hint={
                  paidInFull
                    ? 'Paid in full — the car is marked delivered'
                    : 'Amount taken at the counter'
                }
                leftIcon={<Wallet className="h-4 w-4" />}
                error={errors.paymentAmount?.message}
                {...register(
                  'paymentAmount',
                  carSoldPaymentRules(() => Number(finalSellingPrice.trim()), 'Payment', true),
                )}
              />
            )}

            {/* Only a car marked Delivered has a day it went on. */}
            {showDeliveredDate && (
              <Input
                label="Delivered Date"
                type="date"
                max={todayDateInput()}
                className="animate-fade-in cursor-pointer"
                hint="Left blank, today is stored"
                leftIcon={<CalendarDays className="h-4 w-4" />}
                error={errors.deliveredDate?.message}
                {...register('deliveredDate', deliveredDateRules)}
              />
            )}
          </div>
        </SectionCard>

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
            {sale ? 'Update Sale' : 'Save Sale'}
          </Button>
        </div>
      </form>
    </div>
  )
}
