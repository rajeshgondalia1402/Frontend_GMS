import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Car, IndianRupee, User, UsersRound } from 'lucide-react'
import { Badge, Button, Card, ErrorState, LoadingState } from '@/components/ui'
import { jobCardService } from '@/services/jobCardService'
import { ApiError } from '@/services/httpClient'
import {
  formatServiceDate,
  jobCardStatusLabel,
  jobCardStatusTone,
  vehicleDisplayName,
} from '@/lib/jobCard'
import { staffCategoryLabel } from '@/lib/staff'
import { paymentStatusLabel, paymentStatusTone } from '@/lib/payment'
import { formatCurrency } from '@/lib/utils'
import type { JobCardRecord } from '@/types/jobCard'
import type { StaffCategory } from '@/types/staff'

/**
 * One job card, read-only — reached from the View button on cards that are no
 * longer pending. `GET /auth/jobcard/:id` returns exactly a row of the list,
 * so what the list handed over paints the page while the fetch confirms it.
 */
export function JobCardDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const handed = (location.state as { jobCard?: JobCardRecord } | null)?.jobCard
  const seeded = handed?.id === id ? handed : undefined

  const [job, setJob] = useState<JobCardRecord | null>(seeded ?? null)
  const [loading, setLoading] = useState(!seeded)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setJob(await jobCardService.getJobCard(id))
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Could not load this job card.'
      // What the list handed over keeps the page usable; only a cold open is a
      // dead end.
      if (!seeded) setError(message)
    } finally {
      setLoading(false)
    }
  }, [id, seeded])

  useEffect(() => {
    void load()
  }, [load])

  const backLink = (
    <button
      onClick={() => navigate('/app/job-cards')}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Job Cards
    </button>
  )

  if (!job) {
    return (
      <div>
        {backLink}
        {loading ? (
          <LoadingState />
        ) : (
          <ErrorState
            title="Could not load this job card"
            description={error ?? 'Open the card again from the list.'}
            onRetry={() => void load()}
          />
        )}
      </div>
    )
  }

  const vehicle = job.vehicle
  const customer = vehicle?.customer
  const staff = job.assignedStaff

  return (
    <div>
      {backLink}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{job.jobNumber}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Service date {formatServiceDate(job.serviceDate)}
            {job.completionDate && ` · Completed ${formatServiceDate(job.completionDate)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge tone={jobCardStatusTone(job.status)}>{jobCardStatusLabel(job.status)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User className="h-4 w-4 text-slate-400" /> Customer
              </div>
              <p className="font-medium text-slate-900">{customer?.fullName ?? '—'}</p>
              <p className="text-sm text-slate-500">{customer?.mobileNumber ?? '—'}</p>
            </Card>
            <Card>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Car className="h-4 w-4 text-slate-400" /> Vehicle
              </div>
              <p className="font-medium text-slate-900">
                {vehicle ? vehicleDisplayName(vehicle) : '—'}
              </p>
              <p className="font-mono text-sm text-slate-500">{vehicle?.vehicleNumber ?? '—'}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="text-sm text-slate-700">{vehicle?.vehicleType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Current KM</p>
                  <p className="text-sm text-slate-700">
                    {typeof vehicle?.currentKm === 'number'
                      ? vehicle.currentKm.toLocaleString('en-IN')
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Complaint</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {vehicle?.description?.trim() || 'Nothing recorded.'}
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Services &amp; Items ({job.items?.length ?? 0})
            </h2>
            {job.items && job.items.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {job.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">{item.description}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.qty} × {formatCurrency(item.rate)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-slate-900">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nothing billed on this card yet.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UsersRound className="h-4 w-4 text-slate-400" /> Assigned To
            </div>
            {staff ? (
              <>
                <p className="font-medium text-slate-900">{staff.name}</p>
                <p className="text-sm text-slate-500">
                  {staff.role || staffCategoryLabel(staff.category as StaffCategory)}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Nobody yet.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Summary</h2>
            <div className="flex justify-between text-base font-bold">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">{formatCurrency(job.totalAmount)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              The API totals the lines; the card cannot bill a figure they do not add up to.
            </p>

            {/* Where the bill is, as opposed to where the vehicle is. The
                balance itself lives on the payment screen, which is the one
                place a receipt can be taken. */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-600">Payment</span>
              <Badge tone={paymentStatusTone(job.paymentStatus)}>
                {paymentStatusLabel(job.paymentStatus)}
              </Badge>
            </div>
            <Button
              fullWidth
              className="mt-3"
              variant={job.paymentStatus === "PAID" ? "outline" : "primary"}
              leftIcon={<IndianRupee className="h-4 w-4" />}
              onClick={() =>
                navigate(`/app/job-cards/${job.id}/payment`, { state: { jobCard: job } })
              }
            >
              {job.paymentStatus === "PAID" ? "View receipts" : "Collect payment"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
