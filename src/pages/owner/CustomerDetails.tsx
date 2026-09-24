import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Car, Plus } from 'lucide-react'
import { Button, Card, ErrorState, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/common'
import { CustomerSummaryCard, EditCustomerModal } from '@/components/customers'
import { VehicleFormCard, VehicleSummaryCard } from '@/components/vehicles'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import { clearActiveCustomer, loadActiveCustomer, saveActiveCustomer } from '@/lib/activeCustomer'
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

/**
 * One customer, read-only, with an Edit button and their vehicles — reached
 * both from the View button in the list and straight after adding a customer.
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

  const [editing, setEditing] = useState(false)
  const [formOpen, setFormOpen] = useState(addMode || editMode)

  /**
   * The vehicle the form is about. What the Vehicles tab handed over is the
   * full row; on a reload it falls back to the copy the customer fetch embeds,
   * which is enough to fill the form in.
   */
  const seedVehicle =
    handed?.vehicle ?? (seedVehicleId ? vehicles.find((v) => v.id === seedVehicleId) : undefined)

  /** Editing needs the row itself, so the form waits until it is on hand. */
  const editTarget = editMode ? seedVehicle : undefined

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

  // Keeps the parked copy in step with the server and with every edit, so a
  // refresh shows the details the owner last saved.
  useEffect(() => {
    if (customer) saveActiveCustomer(customer)
  }, [customer])

  const finish = () => {
    clearActiveCustomer()
    navigate(listPath)
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

  return (
    <div>
      {backLink}

      <PageHeader title="Customer Details" subtitle="Their details and the vehicles they bring in." />

      {/* Full width: the details, the vehicles and the vehicle form all lay
          out in columns on a desktop instead of a single narrow stack. */}
      <div className="space-y-4">
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
          onEdit={() => setEditing(true)}
          footer={
            !formOpen && (
              <Button
                fullWidth
                className="sm:w-auto"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setFormOpen(true)}
              >
                {vehicles.length > 0 ? 'Add Another Vehicle' : 'Add Vehicle'}
              </Button>
            )
          }
        />

        {/* The form opens straight under the customer, where the button that
            opened it is — the vehicles already saved stay below it. */}
        {formOpen && (!editMode || editTarget) && (
          <VehicleFormCard
            // Remounts once the seed vehicle arrives, so the form is filled in.
            key={seedVehicle?.id ?? 'new'}
            customerId={customer.id}
            seed={seedVehicle}
            editing={editTarget}
            onSaved={(vehicle) => {
              applySaved(vehicle)
              if (addMode || editMode) navigate(listPath)
              else setFormOpen(false)
            }}
            onCancel={() => {
              if (addMode || editMode) navigate(listPath)
              else setFormOpen(false)
            }}
          />
        )}

        {vehicles.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Vehicles ({vehicles.length})</h2>
            {/* Cards side by side where there is room; each stretches to its row. */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleSummaryCard key={vehicle.id} vehicle={vehicle} detailed />
              ))}
            </div>
          </div>
        )}

        {!formOpen &&
          vehicles.length === 0 &&
          !loading && (
            <Card className="flex items-start gap-3 border-dashed bg-white/60">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">No vehicle yet</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Use "Add Vehicle" above to record the vehicle for this customer. You can also do
                  it later.
                </p>
              </div>
            </Card>
          )}

        <div className="flex pt-1">
          <Button variant="outline" fullWidth className="sm:w-auto sm:flex-none" onClick={finish}>
            Done
          </Button>
        </div>
      </div>

      <EditCustomerModal
        open={editing}
        customer={customer}
        onClose={() => setEditing(false)}
        onUpdated={setCustomer}
      />
    </div>
  )
}
