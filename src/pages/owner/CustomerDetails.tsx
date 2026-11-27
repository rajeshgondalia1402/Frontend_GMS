import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardPlus,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button, Card, ErrorState, Skeleton } from '@/components/ui'
import { FlowSteps, PageHeader } from '@/components/common'
import { CustomerSummaryCard, EditCustomerModal } from '@/components/customers'
import { VehicleFormCard, VehicleSummaryCard } from '@/components/vehicles'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import { clearActiveCustomer, loadActiveCustomer, saveActiveCustomer } from '@/lib/activeCustomer'
import { NEW_CUSTOMER_STEPS } from '@/lib/customerForm'
import { getInitial } from '@/lib/utils'
import type { CustomerRecord, CustomerWithVehicles } from '@/types/customer'
import type { VehicleSummary } from '@/types/vehicle'

function CustomerDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </Card>
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}

/** What the vehicle form on this page is open for, when opened from the page itself. */
type LocalForm =
  | { mode: 'add' }
  | { mode: 'edit'; vehicle: VehicleSummary }
  | { mode: 'again'; vehicle: VehicleSummary }

/** The one-line "whose vehicle is this" strip of the new-customer flow. */
function CustomerStrip({ customer, onEdit }: { customer: CustomerRecord; onEdit: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-base font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {getInitial(customer.fullName)}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Customer saved
          </p>
          <p className="truncate text-sm font-semibold text-slate-900">{customer.fullName}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Phone className="h-3 w-3" /> {customer.mobileNumber}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        leftIcon={<Pencil className="h-3.5 w-3.5" />}
        onClick={onEdit}
      >
        Edit
      </Button>
    </div>
  )
}

/**
 * One customer, read-only, with an Edit button and their vehicles — reached
 * both from the View button in the list and straight after adding a customer.
 *
 * Reached with `?flow=new` (straight after "Add Customer"), the page becomes
 * step 2 of a guided flow: just the vehicle form, then a "done" screen whose
 * buttons lead on to what usually comes next — opening a job card.
 *
 * The details come from `GET /auth/customer/:id`. What the caller handed over
 * — or the copy parked in session storage — only seeds the page so it is never
 * blank while that request is in flight.
 */
export function CustomerDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  /** Reached from the Vehicles tab, which lists the vehicle rather than the
   * customer — the back link then points at that tab. */
  const fromVehicles = searchParams.get('from') === 'vehicles'
  const listPath = fromVehicles ? '/app/vehicles' : '/app/customers'

  /** Straight after creating the customer: the guided add-vehicle step. */
  const flow = searchParams.get('flow') === 'new'
  const [flowStage, setFlowStage] = useState<'vehicle' | 'done'>('vehicle')
  const [justSaved, setJustSaved] = useState<VehicleSummary | null>(null)

  /**
   * Sent by the two buttons on the Vehicles tab, which both land here on the
   * one form: `add` opens it for that vehicle's next visit, `edit` opens it
   * over the vehicle itself. Either way, closing it goes back to the list it
   * was opened from. Without an action the page simply shows the customer.
   */
  const action = searchParams.get('action')
  const addMode = action === 'add'
  const editMode = action === 'edit'
  const seedVehicleId = searchParams.get('vehicleId')

  const handed = location.state as {
    customer?: CustomerWithVehicles
    vehicle?: VehicleSummary
  } | null
  const handedOver = handed?.customer

  const [seed] = useState<CustomerRecord | null>(
    () => loadActiveCustomer(id) ?? handedOver ?? null,
  )
  const [customer, setCustomer] = useState<CustomerRecord | null>(seed)
  // The list already carries every vehicle, so a row opened from there shows
  // them immediately rather than after the fetch.
  const [vehicles, setVehicles] = useState<VehicleSummary[]>(() => handedOver?.vehicles ?? [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Set when the fetch failed but seeded details are still on screen. */
  const [stale, setStale] = useState(false)

  const [editingCustomer, setEditingCustomer] = useState(false)
  const [formOpen, setFormOpen] = useState(addMode || editMode)
  /** Opened from a button on this page rather than from the Vehicles tab. */
  const [localForm, setLocalForm] = useState<LocalForm | null>(null)

  /**
   * The vehicle the form is about. What the Vehicles tab handed over is the
   * full row; on a reload it falls back to the copy the customer fetch embeds,
   * which is enough to fill the form in.
   */
  const urlSeedVehicle =
    handed?.vehicle ?? (seedVehicleId ? vehicles.find((v) => v.id === seedVehicleId) : undefined)

  const seedVehicle = localForm
    ? localForm.mode === 'add'
      ? undefined
      : localForm.vehicle
    : urlSeedVehicle

  /** Editing needs the row itself, so the form waits until it is on hand. */
  const editTarget = localForm
    ? localForm.mode === 'edit'
      ? localForm.vehicle
      : undefined
    : editMode
      ? urlSeedVehicle
      : undefined
  const waitingForEditRow = !localForm && editMode && !editTarget

  /** Puts the saved row in the list: a new one is appended, an edited one replaces. */
  const applySaved = (saved: VehicleSummary) =>
    setVehicles((current) =>
      current.some((v) => v.id === saved.id)
        ? current.map((v) => (v.id === saved.id ? { ...v, ...saved } : v))
        : [...current, saved],
    )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStale(false)

    try {
      const { vehicles: theirVehicles, ...record } = await customerService.getCustomer(id)
      setCustomer(record)
      setVehicles(theirVehicles ?? [])
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load this customer. Please try again.'
      // Seeded details keep the page usable; only a cold load is a dead end.
      if (seed) setStale(true)
      else setError(message)
    } finally {
      setLoading(false)
    }
  }, [id, seed])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * A customer with no vehicle yet gets the vehicle form opened for them,
   * since adding the vehicle is the next step anyway. Decided once, after the
   * first load settles, so Cancel or Save closes it for good.
   */
  const autoOpenDecided = useRef(false)
  useEffect(() => {
    if (flow || loading || !customer || autoOpenDecided.current) return
    autoOpenDecided.current = true
    if (vehicles.length === 0) setFormOpen(true)
  }, [flow, loading, customer, vehicles.length])

  // Keeps the parked copy in step with the server and with every edit, so a
  // refresh shows the details the owner last saved.
  useEffect(() => {
    if (customer) saveActiveCustomer(customer)
  }, [customer])

  // Each step of the flow starts at the top, where its heading is.
  useEffect(() => {
    if (flow) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [flow, flowStage])

  const openForm = (next: LocalForm) => {
    setLocalForm(next)
    setFormOpen(true)
    // The form opens at the top of the page; bring it into view on a phone.
    requestAnimationFrame(() =>
      document.getElementById('vehicle-form')?.scrollIntoView({ behavior: 'smooth' }),
    )
  }

  const closeForm = () => {
    if (!localForm && (addMode || editMode)) {
      navigate(listPath)
      return
    }
    setLocalForm(null)
    setFormOpen(false)
  }

  /** On to a new job card, with this customer and vehicle already filled in. */
  const createJobCard = (vehicle?: VehicleSummary) => {
    if (!customer) return
    clearActiveCustomer()
    navigate('/app/job-cards/new', {
      state: {
        prefill: {
          customer: {
            id: customer.id,
            fullName: customer.fullName,
            mobileNumber: customer.mobileNumber,
          },
          vehicle,
        },
      },
    })
  }

  /** Leaves the flow for the customer's ordinary details page. */
  const viewCustomer = () => {
    // The owner chose to leave the vehicle for later — don't pop the form open.
    autoOpenDecided.current = true
    setFlowStage('vehicle')
    navigate(`/app/customers/${id}`, { replace: true })
  }

  const backLink = (
    <button
      onClick={() => navigate(listPath)}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" /> Back to {fromVehicles ? 'Vehicles' : 'Customers'}
    </button>
  )

  if (!customer) {
    return (
      <div>
        {backLink}
        <PageHeader title="Customer Details" />
        {loading ? (
          <CustomerDetailsSkeleton />
        ) : (
          <ErrorState
            title="Customer details are not available"
            description={error ?? 'Open the customer again from the list to add a vehicle.'}
            onRetry={() => void load()}
          />
        )}
      </div>
    )
  }

  const editModal = (
    <EditCustomerModal
      open={editingCustomer}
      customer={customer}
      onClose={() => setEditingCustomer(false)}
      onUpdated={setCustomer}
    />
  )

  /* ---------------- Guided flow: step 2 (vehicle) and step 3 (done) ---------------- */

  if (flow) {
    if (flowStage === 'done') {
      return (
        <div>
          <PageHeader title="All done!" subtitle="The customer and their vehicle are saved." />
          <FlowSteps steps={NEW_CUSTOMER_STEPS} current={2} />

          <Card className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-900">{customer.fullName}</p>
            <p className="text-sm text-slate-500">{customer.mobileNumber}</p>
            {justSaved && (
              <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-800">
                <Car className="h-4 w-4 text-slate-500" />
                {justSaved.vehicleNumber}
                {justSaved.vehicleType && (
                  <span className="font-normal tracking-normal text-slate-500">
                    · {justSaved.vehicleType}
                  </span>
                )}
              </p>
            )}

            <p className="mx-auto mt-5 max-w-md text-sm text-slate-600">
              What would you like to do next?
            </p>

            <div className="mx-auto mt-4 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              <Button
                size="lg"
                className="sm:col-span-2"
                leftIcon={<ClipboardPlus className="h-5 w-5" />}
                onClick={() => createJobCard(justSaved ?? undefined)}
              >
                Create Job Card for this vehicle
              </Button>
              <Button
                variant="outline"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setJustSaved(null)
                  setFlowStage('vehicle')
                }}
              >
                Add another vehicle
              </Button>
              <Button
                variant="outline"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={() => {
                  clearActiveCustomer()
                  navigate('/app/customers/new')
                }}
              >
                Add another customer
              </Button>
              <Button variant="ghost" leftIcon={<Users className="h-4 w-4" />} onClick={viewCustomer}>
                View customer details
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  clearActiveCustomer()
                  navigate('/app/customers')
                }}
              >
                Back to customer list
              </Button>
            </div>
          </Card>

          {editModal}
        </div>
      )
    }

    return (
      <div>
        <PageHeader
          title="Add Vehicle"
          subtitle="Enter the vehicle this customer brought in and the work it needs."
        />
        <FlowSteps steps={NEW_CUSTOMER_STEPS} current={1} />

        <CustomerStrip customer={customer} onEdit={() => setEditingCustomer(true)} />

        {vehicles.length > 0 && (
          <p className="mb-4 text-sm text-slate-500">
            Already added:{' '}
            <span className="font-medium text-slate-700">
              {vehicles.map((v) => v.vehicleNumber).join(', ')}
            </span>
          </p>
        )}

        <VehicleFormCard
          key={`flow-${vehicles.length}`}
          customerId={customer.id}
          customerName={customer.fullName}
          hideHeading
          cancelLabel={vehicles.length > 0 ? 'Finish' : 'Skip, add later'}
          onSaved={(vehicle) => {
            applySaved(vehicle)
            setJustSaved(vehicle)
            setFlowStage('done')
          }}
          onCancel={() => {
            if (vehicles.length > 0) setFlowStage('done')
            else viewCustomer()
          }}
        />

        {editModal}
      </div>
    )
  }

  /* ---------------- Ordinary details page ---------------- */

  const showForm = formOpen && !waitingForEditRow

  return (
    <div>
      {backLink}

      <PageHeader
        title={customer.fullName}
        subtitle="Customer details and the vehicles they bring in."
      />

      <div className="space-y-5">
        {stale && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-800">
              Showing the details saved on this device — they could not be refreshed from the
              server.{' '}
              <button onClick={() => void load()} className="underline underline-offset-2">
                Retry
              </button>
            </p>
          </div>
        )}

        <CustomerSummaryCard
          customer={customer}
          vehicles={vehicles}
          onEdit={() => setEditingCustomer(true)}
        />

        {showForm && (
          <VehicleFormCard
            // Remounts once the seed vehicle arrives, so the form is filled in.
            key={`${localForm?.mode ?? action ?? 'new'}-${seedVehicle?.id ?? 'new'}`}
            customerId={customer.id}
            customerName={customer.fullName}
            seed={seedVehicle}
            editing={editTarget}
            onSaved={(vehicle) => {
              applySaved(vehicle)
              closeForm()
            }}
            onCancel={closeForm}
          />
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Vehicles <span className="font-normal text-slate-400">({vehicles.length})</span>
            </h2>
            {!showForm && vehicles.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openForm({ mode: 'add' })}
              >
                Add Vehicle
              </Button>
            )}
          </div>

          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleSummaryCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  detailed
                  actions={
                    <>
                      {vehicle.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          className="flex-1"
                          leftIcon={<ClipboardPlus className="h-4 w-4" />}
                          onClick={() => createJobCard(vehicle)}
                        >
                          Create Job Card
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          leftIcon={<RotateCcw className="h-4 w-4" />}
                          onClick={() => openForm({ mode: 'again', vehicle })}
                        >
                          New Visit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={() => openForm({ mode: 'edit', vehicle })}
                      >
                        Edit
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            !showForm &&
            !loading && (
              <Card className="flex flex-col items-center gap-3 border-dashed bg-white/60 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Car className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">No vehicle added yet</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Add the vehicle to start a job card for this customer.
                  </p>
                </div>
                <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm({ mode: 'add' })}>
                  Add Vehicle
                </Button>
              </Card>
            )
          )}
        </section>

        {/* Phones: the main action stays one tap away at the foot of the page. */}
        {!showForm && vehicles.length > 0 && (
          <div className="sm:hidden">
            <Button
              fullWidth
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => openForm({ mode: 'add' })}
            >
              Add Another Vehicle
            </Button>
          </div>
        )}
      </div>

      {editModal}
    </div>
  )
}
