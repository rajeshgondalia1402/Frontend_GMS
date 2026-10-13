import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Car,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Pencil,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { DetailSheet, FactCell, FactStrip, SheetBand } from '@/components/common'
import { insuranceDaysLeft, insuranceNeedsRenewal } from '@/components/vehicles'
import { insuranceDateLabel } from '@/lib/carSelling'
import { agoLabel, daysBetween, formatDate, getInitial, spanLabel } from '@/lib/utils'
import type { CustomerRecord } from '@/types/customer'
import type { VehicleSummary } from '@/types/vehicle'

/** "expired 01-Feb-2026" or "ends in 11 days", for the renewal band. */
function renewalText(vehicle: VehicleSummary): string {
  const left = insuranceDaysLeft(vehicle.insuranceExpiry) ?? 0
  if (left < 0) return `expired ${insuranceDateLabel(vehicle.insuranceExpiry)}`
  return left === 0 ? 'ends today' : `ends in ${spanLabel(left)}`
}

interface CustomerSummaryCardProps {
  customer: CustomerRecord
  /** Their vehicles, for the summary and the insurance warning. */
  vehicles?: VehicleSummary[]
  onEdit: () => void
  /** Rendered under the details — the "Add Vehicle" action on the setup page. */
  footer?: ReactNode
}

/**
 * A saved customer, read only, as one sheet: who they are and how long they
 * have been coming, how to reach them, where their vehicles stand, what the
 * desk has noted, and a warning when a vehicle's insurance is due. A detail
 * never filled in is left out rather than shown as a dash.
 */
export function CustomerSummaryCard({
  customer,
  vehicles = [],
  onEdit,
  footer,
}: CustomerSummaryCardProps) {
  // WhatsApp is only worth a cell when it is not the mobile number again.
  const whatsapp = customer.whatsappNumber?.trim()
  const separateWhatsapp = whatsapp && whatsapp !== customer.mobileNumber ? whatsapp : null
  const email = customer.email?.trim()
  const address = customer.address?.trim()
  const city = customer.city?.trim()
  const notes = customer.notes?.trim()

  const sinceDays = customer.createdAt ? daysBetween(customer.createdAt) : null
  const inService = vehicles.filter((v) => v.status === 'IN_SERVICE').length
  const pending = vehicles.filter((v) => v.status === 'PENDING').length
  const completed = vehicles.filter((v) => v.status === 'COMPLETED').length
  const statusLine = [
    inService && `${inService} in service`,
    pending && `${pending} pending`,
    completed && `${completed} completed`,
  ]
    .filter(Boolean)
    .join(' · ')

  const renewals = vehicles.filter((v) => insuranceNeedsRenewal(v.insuranceExpiry))
  const lastUpdated = agoLabel(customer.updatedAt)

  return (
    <DetailSheet>
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-lg font-semibold text-primary-600">
            {getInitial(customer.fullName)}
          </span>
          <div className="min-w-0">
            <p className="break-words text-base font-semibold text-slate-900">
              {customer.fullName}
            </p>
            <p className="text-sm text-slate-500">
              {sinceDays === null
                ? 'Customer'
                : sinceDays === 0
                  ? 'New customer — joined today'
                  : `Customer for ${spanLabel(sinceDays)}`}
              {customer.createdAt && (
                <span className="text-slate-400"> · since {formatDate(customer.createdAt)}</span>
              )}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full shrink-0 sm:w-auto"
          leftIcon={<Pencil className="h-4 w-4" />}
          onClick={onEdit}
        >
          Edit Customer
        </Button>
      </div>

      <div className="border-t border-slate-100">
        <FactStrip>
          <FactCell
            icon={Phone}
            label="Mobile"
            value={
              <a
                href={`tel:${customer.mobileNumber}`}
                className="text-primary-700 hover:underline"
              >
                {customer.mobileNumber}
              </a>
            }
            sub={whatsapp && !separateWhatsapp ? 'Also on WhatsApp' : undefined}
          />
          {separateWhatsapp && (
            <FactCell icon={MessageCircle} label="WhatsApp" value={separateWhatsapp} />
          )}
          {email && (
            <FactCell
              icon={Mail}
              label="Email"
              value={
                // One line, cut with an ellipsis — an address broken mid-word misreads.
                <a
                  href={`mailto:${email}`}
                  title={email}
                  className="block truncate text-primary-700 hover:underline"
                >
                  {email}
                </a>
              }
            />
          )}
          {(address || city) && (
            <FactCell
              icon={MapPin}
              label="Address"
              value={address || city}
              sub={address && city ? city : undefined}
            />
          )}
          <FactCell
            icon={Car}
            label="Vehicles"
            value={
              vehicles.length === 0
                ? 'None yet'
                : `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'}`
            }
            sub={statusLine || undefined}
            tone={inService > 0 ? 'warn' : vehicles.length ? 'good' : 'muted'}
          />
        </FactStrip>
      </div>

      {renewals.length > 0 && (
        <SheetBand tone="warn">
          <p className="flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">Insurance to renew: </span>
              {renewals.map((v) => `${v.vehicleNumber} ${renewalText(v)}`).join(' · ')}
            </span>
          </p>
        </SheetBand>
      )}

      {notes && (
        <SheetBand>
          <p className="flex items-start gap-2 text-sm text-slate-700">
            <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="whitespace-pre-line">{notes}</span>
          </p>
        </SheetBand>
      )}

      {(footer || lastUpdated) && (
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>{footer}</div>
          {lastUpdated && (
            <p className="text-xs text-slate-400">Details last updated {lastUpdated.toLowerCase()}</p>
          )}
        </div>
      )}
    </DetailSheet>
  )
}
