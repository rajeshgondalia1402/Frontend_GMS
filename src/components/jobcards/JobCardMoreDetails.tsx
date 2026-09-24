import {
  CarFront,
  ClipboardList,
  Clock,
  Fuel,
  Gauge,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react'
import {
  CHIP_GOOD,
  CHIP_WARN,
  DetailSheet,
  FactCell,
  FactChip,
  FactStrip,
  SheetBand,
  SheetSection,
} from '@/components/common'
import { cn, daysBetween, spanLabel } from '@/lib/utils'
import { formatAmount, formatMoney, formatServiceDate, vehicleDisplayName } from '@/lib/jobCard'
import { insuranceDateLabel, isInsuranceExpired } from '@/lib/carSelling'
import type { JobCardRecord } from '@/types/jobCard'

interface JobCardMoreDetailsProps {
  job: JobCardRecord
}

/**
 * How long the vehicle has been with the garage: from the service date to the
 * day it was delivered, or to today while the work is still going on.
 */
function turnaround(job: JobCardRecord) {
  const delivered = job.status === 'DELIVERED'
  const days = daysBetween(job.serviceDate, delivered && job.completionDate ? job.completionDate : new Date())

  if (days === null || days < 0) {
    return { value: '—', sub: undefined, tone: 'muted' as const }
  }
  if (delivered) {
    return {
      value: days === 0 ? 'Same day' : `Done in ${spanLabel(days)}`,
      sub: job.completionDate ? `Delivered ${formatServiceDate(job.completionDate)}` : 'Delivered',
      tone: 'good' as const,
    }
  }
  return {
    value: days === 0 ? 'Came in today' : `${spanLabel(days)} in garage`,
    sub: `Since ${formatServiceDate(job.serviceDate)}`,
    // A vehicle sitting more than a week is worth a second look.
    tone: days > 7 ? ('warn' as const) : ('primary' as const),
  }
}

/**
 * What the job card row leaves out, opened under it by the row's arrow — one
 * sheet, so every part lines up on the same edges:
 *
 *   - a strip of who and what the card is for, and how long it has taken;
 *   - the vehicle's facts as chips;
 *   - what was asked for beside what was billed.
 *
 * The row already carries the job number, service date, amount, work status
 * and payment status, so none of that is repeated. A complaint or bill that
 * was never written is left out rather than given an empty box.
 */
export function JobCardMoreDetails({ job }: JobCardMoreDetailsProps) {
  const vehicle = job.vehicle
  const customer = vehicle?.customer
  const items = job.items ?? []
  const complaint = vehicle?.description?.trim()

  const name = vehicle ? vehicleDisplayName(vehicle) : ''
  const insuranceOn = insuranceDateLabel(vehicle?.insuranceExpiry)
  const insuranceExpired = isInsuranceExpired(vehicle?.insuranceExpiry)
  // WhatsApp is only worth showing when it is not the mobile number again.
  const whatsapp = customer?.whatsappNumber?.trim()
  const separateWhatsapp = whatsapp && whatsapp !== customer?.mobileNumber ? whatsapp : null
  const time = turnaround(job)

  const hasChips = Boolean(vehicle?.fuelType || vehicle?.currentKm || insuranceOn)
  const hasBody = Boolean(complaint || items.length)

  return (
    <DetailSheet>
      <FactStrip>
        <FactCell
          icon={CarFront}
          label="Vehicle"
          value={vehicle?.vehicleNumber || '—'}
          sub={name && name !== vehicle?.vehicleNumber ? name : undefined}
        />
        <FactCell
          icon={User}
          label="Customer"
          value={customer?.fullName || '—'}
          sub={
            customer?.mobileNumber && (
              <a
                href={`tel:${customer.mobileNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-primary-700 hover:underline"
              >
                {customer.mobileNumber}
              </a>
            )
          }
        />
        <FactCell
          icon={Wrench}
          label="Attended By"
          value={job.assignedStaff?.name ?? <span className="text-slate-400">Not assigned</span>}
          sub={job.assignedStaff?.role ?? undefined}
          tone={job.assignedStaff ? 'primary' : 'muted'}
        />
        <FactCell icon={Clock} label="Turnaround" value={time.value} sub={time.sub} tone={time.tone} />
      </FactStrip>

      {(hasChips || separateWhatsapp) && (
        <SheetBand>
          <div className="flex flex-wrap items-center gap-1.5">
            {vehicle?.fuelType && <FactChip icon={Fuel}>{vehicle.fuelType}</FactChip>}
            {vehicle?.currentKm ? (
              <FactChip icon={Gauge}>{vehicle.currentKm.toLocaleString('en-IN')} km</FactChip>
            ) : null}
            {insuranceOn && (
              <FactChip icon={ShieldCheck} className={insuranceExpired ? CHIP_WARN : CHIP_GOOD}>
                {insuranceExpired ? `Insurance expired ${insuranceOn}` : `Insured till ${insuranceOn}`}
              </FactChip>
            )}
            {separateWhatsapp && (
              <FactChip icon={MessageCircle}>WhatsApp {separateWhatsapp}</FactChip>
            )}
          </div>
        </SheetBand>
      )}

      {hasBody && (
        <div
          className={cn(
            'grid grid-cols-1 border-t border-slate-100',
            // Side by side from lg only when there is something for both sides.
            complaint && items.length > 0 && 'lg:grid-cols-5',
          )}
        >
          {complaint && (
            <SheetSection
              icon={ClipboardList}
              title="Work Requested"
              className={items.length > 0 ? 'lg:col-span-2' : undefined}
            >
              <p className="whitespace-pre-line border-l-2 border-primary-200 pl-3 text-sm leading-relaxed text-slate-700">
                {complaint}
              </p>
            </SheetSection>
          )}

          {items.length > 0 && (
            <SheetSection
              icon={ReceiptText}
              title="Items Billed"
              action={
                <span className="text-xs text-slate-500">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              }
              className={cn(
                complaint &&
                  'border-t border-slate-100 lg:col-span-3 lg:border-l lg:border-t-0',
              )}
            >
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-slate-800">
                        {item.description}
                      </p>
                      {/* Quantity and rate only say something when more than one was fitted. */}
                      {item.qty !== 1 && (
                        <p className="text-xs text-slate-500">
                          {item.qty} × ₹{formatAmount(item.rate)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {formatMoney(item.total ?? item.qty * item.rate)}
                    </span>
                  </li>
                ))}
              </ul>
            </SheetSection>
          )}
        </div>
      )}
    </DetailSheet>
  )
}
