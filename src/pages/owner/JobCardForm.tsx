import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  ClipboardList,
  Copy,
  Fuel,
  Gauge,
  Hash,
  Loader2,
  MessageSquareWarning,
  Phone,
  Plus,
  Receipt,
  User,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { Button, ErrorState, Input, LoadingState, Select, Textarea, useToast } from '@/components/ui'
import {
  CustomerSearchInput,
  JobCardSummary,
  JobItemModal,
  JobItemsTable,
  RecordPickerModal,
  SectionCard,
} from '@/components/jobcards'
import type { JobItemDraft, PickerOption } from '@/components/jobcards'
import {
  JOB_STATUS_DOT,
  JOB_STATUS_TEXT,
  fromJobCardStatus,
  jobCardStatusLabel,
  jobStatusOptions,
  toJobCardStatus,
  calculateTotals,
  normalizeKmInput,
  toDateInputValue,
  vehicleDisplayName,
} from '@/lib/jobCard'
import { normalizeMobileInput, validateMobileNumber } from '@/lib/validation'
import { staffCategoryLabel } from '@/lib/staff'
import { useAllStaff } from '@/hooks/useAllStaff'
import { useCustomerVehicles } from '@/hooks/useCustomerVehicles'
import { useJobNumber } from '@/hooks/useJobNumber'
import { createJobCard, getJobCard, getJobNumber, updateJobCard } from '@/services/jobCardService'
import { ApiError } from '@/services/httpClient'
import { cn } from '@/lib/utils'
import type { CustomerRecord } from '@/types/customer'
import type { VehicleWithCustomer } from '@/types/vehicle'
import type { CreateJobCardPayload, JobCardRecord, UpdateJobCardPayload } from '@/types/jobCard'
import type { ApiFieldError } from '@/types/auth'
import type { JobLineItem, JobStatus } from '@/types'

interface CustomerState {
  id: string
  name: string
  mobile: string
}

interface VehicleState {
  id: string
  name: string
  number: string
  /** The API carries a vehicle type rather than a model year. */
  type: string
  fuelType: string
}

const EMPTY_CUSTOMER: CustomerState = { id: '', name: '', mobile: '' }
const EMPTY_VEHICLE: VehicleState = { id: '', name: '', number: '', type: '', fuelType: '' }

export function JobCardForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  /**
   * With an id in the path the screen is editing that card: the same form,
   * filled in from the API, saving over the card instead of opening a new one.
   */
  const { id: cardId } = useParams()
  const isEdit = Boolean(cardId)

  // Asked for as the screen opens: a suggestion, not a reservation, so it is
  // shown read only and re-asked for if the API turns the save away. A card
  // being edited already has its number.
  const {
    jobNumber: code,
    loading: codeLoading,
    error: codeError,
    reload: reloadJobNumber,
  } = useJobNumber(!isEdit)
  // A card starts as work still to do.
  const [status, setStatus] = useState<JobStatus>('pending')
  // The picker offers Pending and Delivered — Delivered only on a card that
  // already exists, since a new one always opens as PENDING. A card in one of
  // the states the picker does not name — in progress, or called off — has
  // that state appended, unpickable, rather than read as something it is not.
  const statusOptions = useMemo(() => {
    const offered = jobStatusOptions(isEdit)
    if (offered.some((o) => o.value === status)) return offered
    return [
      ...offered,
      { label: jobCardStatusLabel(toJobCardStatus(status)), value: status, disabled: true },
    ]
  }, [status, isEdit])
  // Today, as the date input writes it. A card is opened for work being done
  // now or booked in — never for a day that has already gone.
  const today = toDateInputValue(new Date())
  const [serviceDate, setServiceDate] = useState(today)

  const [customer, setCustomer] = useState<CustomerState>(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState<VehicleState>(EMPTY_VEHICLE)
  const [currentKm, setCurrentKm] = useState('')

  // The moment a saved customer is on the card, their vehicles are fetched —
  // searched by the mobile number, the surest thing to look them up by, or by
  // the name when a record somehow has no number.
  const {
    vehicles: customerVehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
  } = useCustomerVehicles({
    search: customer.mobile.trim() || customer.name.trim(),
    customerId: customer.id,
  })

  const [staffId, setStaffId] = useState('')
  // Only the people currently working: a card cannot be handed to someone
  // who has been switched off.
  const {
    staff,
    loading: staffLoading,
    error: staffError,
    reload: reloadStaff,
  } = useAllStaff('ACTIVE')
  const [complaint, setComplaint] = useState('')

  const [vehiclePicker, setVehiclePicker] = useState(false)
  const [items, setItems] = useState<JobLineItem[]>([])
  const [discount, setDiscount] = useState('')

  const [itemModal, setItemModal] = useState<{ open: boolean; item: JobLineItem | null }>({
    open: false,
    item: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  /** The card being edited: its number, and whether it has arrived yet. */
  const handed = (location.state as { jobCard?: JobCardRecord } | null)?.jobCard
  const seededCard = handed?.id === cardId ? handed : undefined
  const [cardNumber, setCardNumber] = useState(seededCard?.jobNumber ?? '')
  const [loadingCard, setLoadingCard] = useState(isEdit && !seededCard)
  const [loadError, setLoadError] = useState<string | null>(null)

  /**
   * The ids of the lines the API already holds. A line added here has an id of
   * this screen's own making, which the API has never seen, so it goes out
   * without one — that is what tells the two apart on the way back.
   */
  const savedItemIds = useRef<Set<string>>(new Set())

  // Line items live only in this form until it is saved, so a running counter
  // is all the key they need.
  const itemSeq = useRef(0)

  /**
   * The complaint last copied off a vehicle. Anything the desk has typed over
   * it is theirs and is left alone when another vehicle is chosen.
   */
  const filledComplaint = useRef('')

  const totals = useMemo(() => calculateTotals(items, Number(discount || 0)), [items, discount])

  /** Fills the whole form in from a card the API handed back. */
  const fillFromCard = (card: JobCardRecord) => {
    setCardNumber(card.jobNumber)
    setStatus(fromJobCardStatus(card.status))
    if (card.serviceDate) setServiceDate(toDateInputValue(new Date(card.serviceDate)))
    setStaffId(card.assignedStaffId ?? '')

    const onCard = card.vehicle
    if (onCard) {
      setCustomer({
        id: onCard.customer?.id ?? '',
        name: onCard.customer?.fullName ?? '',
        mobile: onCard.customer?.mobileNumber ?? '',
      })
      setVehicle({
        id: onCard.id,
        name: vehicleDisplayName(onCard),
        number: onCard.vehicleNumber ?? '',
        type: onCard.vehicleType ?? '',
        fuelType: onCard.fuelType ?? '',
      })
      setCurrentKm(
        onCard.currentKm === null || onCard.currentKm === undefined ? '' : String(onCard.currentKm),
      )
      const described = onCard.description?.trim() ?? ''
      setComplaint(described)
      // Nothing here was copied off another vehicle, so nothing is the form's
      // to overwrite later.
      filledComplaint.current = ''
    }

    const lines = card.items ?? []
    savedItemIds.current = new Set(lines.map((item) => item.id))
    setItems(lines.map(({ id, description, qty, rate }) => ({ id, description, qty, rate })))
  }

  /**
   * The card being edited. What the list handed over fills the form straight
   * away; the fetch behind it is what makes a reload or a pasted link work.
   */
  useEffect(() => {
    if (!cardId) return

    let cancelled = false
    if (seededCard) fillFromCard(seededCard)
    setLoadError(null)

    getJobCard(cardId)
      .then((card) => {
        if (cancelled) return
        fillFromCard(card)
        setLoadingCard(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        // What the list handed over keeps the form usable; only a cold open is
        // a dead end.
        if (!seededCard) {
          setLoadError(
            cause instanceof ApiError ? cause.message : 'Could not load this job card.',
          )
        }
        setLoadingCard(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId])

  /** The customer's whole fleet, for the desk that cannot name the vehicle. */
  const vehicleOptions: PickerOption[] = customerVehicles.map((v) => ({
    id: v.id,
    title: vehicleDisplayName(v),
    subtitle: v.vehicleNumber,
    meta: [v.vehicleType, v.fuelType].filter(Boolean).join(' · '),
  }))

  /**
   * The job title is what the desk knows a person by; the category stands in
   * when they have none.
   */
  const staffOptions = staff.map((s) => ({
    value: s.id,
    label: `${s.name} · ${s.role || staffCategoryLabel(s.category)}`,
  }))

  const staffPlaceholder = staffLoading
    ? 'Loading staff…'
    : staffError
      ? 'Staff unavailable'
      : staffOptions.length === 0
        ? 'No active staff'
        : 'Select staff'

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })

  /**
   * A saved customer picked from either suggestion list — the name box or the
   * mobile box. Both fields are filled from the record, so whichever one the
   * desk started typing in, the other is completed for them.
   */
  const selectCustomer = (picked: CustomerRecord) => {
    // A vehicle belongs to the customer who was on the card, so moving to
    // another customer takes their car off it.
    if (picked.id !== customer.id) {
      setVehicle(EMPTY_VEHICLE)
      setCurrentKm('')
      if (complaint === filledComplaint.current) {
        setComplaint('')
        filledComplaint.current = ''
      }
    }
    setCustomer({ id: picked.id, name: picked.fullName, mobile: picked.mobileNumber })
    clearError('customerName')
    clearError('customerMobile')
  }

  const selectVehicle = (picked: VehicleWithCustomer) => {
    setVehicle({
      id: picked.id,
      name: vehicleDisplayName(picked),
      number: picked.vehicleNumber,
      type: picked.vehicleType ?? '',
      fuelType: picked.fuelType ?? '',
    })
    // The reading the garage last took is the one to service from — the desk
    // corrects it to today's odometer.
    if (picked.currentKm !== null && picked.currentKm !== undefined) {
      setCurrentKm(String(picked.currentKm))
    }

    // What is on file against the vehicle is what the customer came in about.
    const described = picked.description?.trim() ?? ''
    if (!complaint.trim() || complaint === filledComplaint.current) {
      setComplaint(described)
      filledComplaint.current = described
    }
    clearError('vehicleName')
    clearError('vehicleNumber')
  }

  const selectVehicleOption = (option: PickerOption) => {
    const picked = customerVehicles.find((v) => v.id === option.id)
    if (!picked) return
    selectVehicle(picked)
    setVehiclePicker(false)
  }

  // A customer with a single vehicle has nothing to choose: fill it in and let
  // the desk get on with the job. This runs on a fresh fetch only, so a vehicle
  // the desk has just cleared is not put straight back.
  useEffect(() => {
    if (isEdit) return
    if (customerVehicles.length === 1 && !vehicle.id) selectVehicle(customerVehicles[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerVehicles])

  const copyVehicleNumber = async () => {
    if (!vehicle.number.trim()) return
    try {
      await navigator.clipboard.writeText(vehicle.number)
      toast('Vehicle number copied', 'success')
    } catch {
      toast('Could not copy the vehicle number', 'error')
    }
  }

  const saveItem = (draft: JobItemDraft) => {
    const editing = itemModal.item
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...draft } : i)))
      return
    }
    itemSeq.current += 1
    setItems((prev) => [...prev, { id: `item-${itemSeq.current}`, ...draft }])
    clearError('items')
  }

  const patchItem = (id: string, patch: Partial<Pick<JobLineItem, 'qty' | 'rate'>>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  /** A card being sent on needs the lot. */
  const validate = () => {
    const next: Record<string, string> = {}

    if (!customer.name.trim()) next.customerName = 'Customer name is required'

    const mobileError = validateMobileNumber(customer.mobile)
    if (mobileError) next.customerMobile = mobileError

    // A card is opened against a saved vehicle: the API takes a `vehicleId`
    // and has no way to create the vehicle along the way.
    if (!vehicle.name.trim()) next.vehicleName = 'Vehicle is required'
    else if (!vehicle.id) next.vehicleName = 'Pick the vehicle from the list — add it to the customer first if it is new'
    if (!vehicle.number.trim()) next.vehicleNumber = 'Vehicle number is required'

    // Both of these are written onto the vehicle, and both are required there.
    // `min` greys the past out of the picker; the form is `noValidate`, so a
    // date typed straight into the box is caught here.
    // The date is fixed once the card exists — the API takes no new one — so an
    // older card is not held to a rule it was never saved under.
    if (!serviceDate) next.serviceDate = 'Service date is required'
    else if (!isEdit && serviceDate < today) next.serviceDate = 'Service date cannot be in the past'

    if (!complaint.trim()) next.complaint = 'Say what the customer came in about'

    if (items.length === 0) next.items = 'Add at least one service or item'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  /** Where the API's own field names land on this form. */
  const ERROR_FIELDS: Record<string, string> = {
    vehicleId: 'vehicleName',
    currentKm: 'currentKm',
    description: 'complaint',
    items: 'items',
  }

  const applyFieldErrors = (fieldErrors: ApiFieldError[]) => {
    const next: Record<string, string> = {}
    fieldErrors.forEach(({ field, message }) => {
      const key = ERROR_FIELDS[field.split('.')[0]]
      if (key) next[key] = message
    })
    if (Object.keys(next).length > 0) setErrors((prev) => ({ ...prev, ...next }))
  }

  /** Everything the API is told; it works the totals out itself. */
  const buildPayload = (jobNumber: string): CreateJobCardPayload => ({
    vehicleId: vehicle.id,
    jobNumber,
    // The date the desk picked, as the instant that day starts here.
    serviceDate: new Date(`${serviceDate}T00:00:00`).toISOString(),
    // No status: the API takes none on create and always opens a card as
    // PENDING, which is the only thing the picker offers.
    assignedStaffId: staffId || null,
    // A reading nobody took is left out rather than written to the vehicle as 0.
    ...(currentKm.trim() ? { currentKm: Number(currentKm) } : {}),
    description: complaint.trim(),
    items: items.map(({ description, qty, rate }) => ({ description, qty, rate })),
  })

  /**
   * What an edit sends. The vehicle, the customer, the number and the date are
   * not in it: the API does not take them, so the form shows them read only.
   */
  const buildUpdate = (): UpdateJobCardPayload => ({
    status: toJobCardStatus(status),
    assignedStaffId: staffId || null,
    // Blank leaves the vehicle's reading as it stands rather than zeroing it.
    ...(currentKm.trim() ? { currentKm: Number(currentKm) } : {}),
    description: complaint.trim(),
    items: items.map(({ id, description, qty, rate }) =>
      savedItemIds.current.has(id) ? { id, description, qty, rate } : { description, qty, rate },
    ),
  })

  const update = async () => {
    if (!validate()) {
      toast('Please complete the highlighted fields', 'error')
      return
    }

    setSaving(true)
    try {
      await updateJobCard(cardId as string, buildUpdate())
      toast('Job card updated', 'success')
      navigate('/app/job-cards')
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Could not update the job card. Please try again.'
      if (cause instanceof ApiError) applyFieldErrors(cause.fieldErrors)
      toast(message, 'error')
      setSaving(false)
    }
  }

  const save = async () => {
    if (!validate()) {
      toast('Please complete the highlighted fields', 'error')
      return
    }

    setSaving(true)
    try {
      try {
        await createJobCard(buildPayload(code))
      } catch (cause) {
        // The number was a suggestion, not a reservation: another desk saving
        // first is a 409, and the fix is simply the next number along.
        if (!(cause instanceof ApiError) || cause.status !== 409) throw cause
        const { jobNumber } = await getJobNumber()
        await createJobCard(buildPayload(jobNumber))
      }

      toast('Job card created', 'success')
      navigate('/app/job-cards')
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Could not save the job card. Please try again.'
      if (cause instanceof ApiError) {
        applyFieldErrors(cause.fieldErrors)
        // A number this garage has now used is no longer the one to offer.
        if (cause.status === 409) reloadJobNumber()
      }
      toast(message, 'error')
      setSaving(false)
    }
  }

  const backLink = (
    <button
      onClick={() => navigate('/app/job-cards')}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Job Cards
    </button>
  )

  if (isEdit && (loadingCard || loadError)) {
    return (
      <div>
        {backLink}
        {loadingCard ? (
          <LoadingState />
        ) : (
          <ErrorState
            title="Could not load this job card"
            description={loadError ?? ''}
            onRetry={() => navigate(0)}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      {backLink}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (isEdit) update()
          else save()
        }}
        noValidate
      >
        {/* Card number, status and service date */}
        <div className="mb-4 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-3 sm:p-5">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Job Card #</span>
            {isEdit ? (
              <output className="block text-xl font-bold text-slate-900 sm:text-2xl">
                {cardNumber || '—'}
              </output>
            ) : codeLoading ? (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Getting number…
              </span>
            ) : codeError ? (
              <span className="flex flex-wrap items-center gap-2 text-xs text-red-600">
                {codeError}
                <button
                  type="button"
                  onClick={reloadJobNumber}
                  className="font-medium text-primary-600 underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              </span>
            ) : (
              <output className="block text-xl font-bold text-slate-900 sm:text-2xl">{code}</output>
            )}
          </div>

          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <div className="relative">
              <span
                className={cn(
                  'pointer-events-none absolute left-3.5 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full',
                  JOB_STATUS_DOT[status],
                )}
              />
              <Select
                id="status"
                options={statusOptions}
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className={cn('pl-8 font-medium', JOB_STATUS_TEXT[status])}
              />
            </div>
          </div>

          <Input
            label="Service Date"
            type="date"
            value={serviceDate}
            min={isEdit ? undefined : today}
            // The API takes no new service date, so an edit shows the one the
            // card was opened on rather than pretending it can be moved.
            disabled={isEdit}
            hint={isEdit ? 'Fixed once the card is open' : undefined}
            error={errors.serviceDate}
            onChange={(e) => {
              setServiceDate(e.target.value)
              clearError('serviceDate')
            }}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Customer & vehicle */}
          <SectionCard icon={User} title="Customer & Vehicle Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <CustomerSearchInput
                  label="Customer Name *"
                  field="name"
                  placeholder="Start typing a name"
                  value={customer.name}
                  selected={Boolean(customer.id)}
                  disabled={isEdit}
                  onValueChange={(value) => {
                    // Editing the box detaches it from the saved customer: what
                    // is typed from here on is a new customer's name.
                    setCustomer((prev) => ({ ...prev, id: '', name: value }))
                    clearError('customerName')
                  }}
                  onSelect={selectCustomer}
                  error={errors.customerName}
                  rightSlot={
                    <span className="flex h-9 w-9 items-center justify-center text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                  }
                />
                <CustomerSearchInput
                  label="Mobile Number *"
                  field="mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  disabled={isEdit}
                  // No `maxLength`: the browser would cut a pasted "+91 98765
                  // 43210" to ten characters before it could be normalised, and
                  // it silently swallowed every keystroke once the box was full.
                  // `normalizeMobileInput` is what holds the number to 10 digits.
                  value={customer.mobile}
                  selected={Boolean(customer.id)}
                  onValueChange={(value) => {
                    setCustomer((prev) => ({
                      ...prev,
                      id: '',
                      mobile: normalizeMobileInput(value),
                    }))
                    clearError('customerMobile')
                  }}
                  onSelect={selectCustomer}
                  error={errors.customerMobile}
                  rightSlot={
                    <span className="flex h-9 w-9 items-center justify-center text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                  }
                />
              </div>

              <div className="space-y-4">
                <Input
                  id="vehicleName"
                  label="Vehicle *"
                  placeholder={customer.id ? 'Tap to pick the vehicle' : 'Find the customer first'}
                  value={vehicle.name}
                  disabled={isEdit}
                  // The saved vehicles are read in the picker, not guessed at in
                  // a list: touching the box opens it.
                  onClick={() => !isEdit && customer.id && setVehiclePicker(true)}
                  onChange={(e) => {
                    setVehicle((prev) => ({ ...prev, id: '', name: e.target.value }))
                    clearError('vehicleName')
                  }}
                  error={errors.vehicleName}
                  rightSlot={
                    <button
                      type="button"
                      disabled={isEdit}
                      onClick={() => setVehiclePicker(true)}
                      aria-label="Choose a saved vehicle"
                      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Car className="h-4 w-4" />
                    </button>
                  }
                />

                <Input
                  label="Vehicle Number *"
                  placeholder="GJ05AB1234"
                  className="font-mono uppercase"
                  value={vehicle.number}
                  disabled={isEdit}
                  leftIcon={<Hash className="h-4 w-4" />}
                  onChange={(e) => {
                    setVehicle((prev) => ({ ...prev, number: e.target.value.toUpperCase() }))
                    clearError('vehicleNumber')
                  }}
                  error={errors.vehicleNumber}
                  rightSlot={
                    <button
                      type="button"
                      onClick={copyVehicleNumber}
                      aria-label="Copy vehicle number"
                      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  }
                />
              </div>

              {/* What the picked vehicle is, laid across the whole card rather
                  than squeezed into the column the vehicle boxes sit in. */}
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:col-span-2 sm:grid-cols-3">
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Vehicle Type</span>
                  <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5">
                    <Car className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {vehicle.type || '—'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Fuel Type</span>
                  <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5">
                    <Fuel className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {vehicle.fuelType || '—'}
                    </span>
                  </div>
                </div>

                <Input
                  id="currentKm"
                  label="Current KM"
                  inputMode="numeric"
                  placeholder="45230"
                  className="font-semibold tabular-nums"
                  value={currentKm}
                  leftIcon={<Gauge className="h-4 w-4" />}
                  error={errors.currentKm}
                  onChange={(e) => {
                    setCurrentKm(normalizeKmInput(e.target.value))
                    clearError('currentKm')
                  }}
                />
              </div>
            </div>
          </SectionCard>

          {/* Job details */}
          <SectionCard icon={ClipboardList} title="Job Details">
            <div className="space-y-4">
              <div>
                <Select
                  id="assignedStaff"
                  label="Assigned Staff"
                  placeholder={staffPlaceholder}
                  options={staffOptions}
                  value={staffId}
                  leftIcon={<UsersRound className="h-4 w-4" />}
                  disabled={staffLoading || staffOptions.length === 0}
                  onChange={(e) => setStaffId(e.target.value)}
                />
                {staffError && (
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-red-600">
                    {staffError}
                    <button
                      type="button"
                      onClick={reloadStaff}
                      className="font-medium text-primary-600 underline-offset-2 hover:underline"
                    >
                      Retry
                    </button>
                  </p>
                )}
              </div>
              <Textarea
                id="complaint"
                label="Customer Complaint *"
                rows={5}
                placeholder="Car is making noise while braking and general service required."
                leftIcon={<MessageSquareWarning className="h-4 w-4" />}
                value={complaint}
                error={errors.complaint}
                onChange={(e) => {
                  setComplaint(e.target.value)
                  clearError('complaint')
                }}
              />
            </div>
          </SectionCard>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Services / job items */}
          <SectionCard
            icon={Wrench}
            title="Services / Job Items"
            className="lg:col-span-2"
            action={
              <Button
                type="button"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setItemModal({ open: true, item: null })}
              >
                <span className="hidden sm:inline">Add Service / Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            }
          >
            <JobItemsTable
              items={items}
              onPatch={patchItem}
              onEdit={(item) => setItemModal({ open: true, item })}
              onRemove={removeItem}
              onAdd={() => setItemModal({ open: true, item: null })}
            />
            {errors.items && <p className="mt-3 text-xs text-red-600">{errors.items}</p>}
          </SectionCard>

          {/* Summary */}
          <SectionCard icon={Receipt} title="Summary">
            <JobCardSummary totals={totals} discount={discount} onDiscountChange={setDiscount} />
          </SectionCard>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              fullWidth
              className="sm:w-auto"
              disabled={saving}
              onClick={() => navigate('/app/job-cards')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              className="sm:w-auto"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              loading={saving}
              disabled={saving}
            >
              {isEdit ? 'Edit Job Card' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </form>

      <RecordPickerModal
        open={vehiclePicker}
        title="Select Vehicle"
        searchPlaceholder="Search by model or number..."
        options={vehicleOptions}
        selectedId={vehicle.id}
        loading={vehiclesLoading}
        error={vehiclesError}
        emptyLabel={
          customer.id
            ? 'This customer has no vehicles on file yet — type the vehicle on the card instead.'
            : 'Choose a customer to see their vehicles.'
        }
        onSelect={selectVehicleOption}
        onClose={() => setVehiclePicker(false)}
      />

      <JobItemModal
        open={itemModal.open}
        item={itemModal.item}
        onSave={saveItem}
        onClose={() => setItemModal({ open: false, item: null })}
      />
    </div>
  )
}
