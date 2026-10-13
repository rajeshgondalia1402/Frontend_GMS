import {
  AlertTriangle,
  CalendarDays,
  Car,
  Fuel,
  Gauge,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Palette,
  ShieldCheck,
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
import { VehicleStatusBadge } from '@/components/vehicles'
import { daysBetween, formatDate, spanLabel } from '@/lib/utils'
import { insuranceDateLabel } from '@/lib/carSelling'
import type { CustomerWithVehicles } from '@/types/customer'
import type { VehicleSummary } from '@/types/vehicle'

interface CustomerMoreDetailsProps {
  customer: CustomerWithVehicles
}

/** Insurance within this many days of running out is flagged as expiring. */
const EXPIRING_WITHIN_DAYS = 30

/** Where a vehicle's insurance stands: days left, or `null` with no date. */
function insuranceDaysLeft(vehicle: VehicleSummary): number | null {
  if (!vehicle.insuranceExpiry) return null
  // The date comes at midnight UTC; only its date part means anything.
  const day = vehicle.insuranceExpiry.slice(0, 10)
  return daysBetween(new Date(), `${day}T00:00:00`)
}

/** One of the customer's vehicles, as a compact card of its own. */
function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  // The make and model when known; the type stands in for them otherwise, and
  // is then not repeated as a chip.
  const built = [vehicle.brand, vehicle.model, vehicle.variant]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
  const subtitle = built || vehicle.vehicleType || ''
  const insuranceOn = insuranceDateLabel(vehicle.insuranceExpiry)
  const left = insuranceDaysLeft(vehicle)

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-primary-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold tracking-wide text-slate-900">{vehicle.vehicleNumber}</p>
          {subtitle && <p className="break-words text-xs text-slate-500">{subtitle}</p>}
        </div>
        {vehicle.status && (
          <span className="shrink-0 whitespace-nowrap">
            <VehicleStatusBadge status={vehicle.status} />
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {built && vehicle.vehicleType && <FactChip icon={Car}>{vehicle.vehicleType}</FactChip>}
        {vehicle.fuelType && <FactChip icon={Fuel}>{vehicle.fuelType}</FactChip>}
        {vehicle.color && <FactChip icon={Palette}>{vehicle.color}</FactChip>}
        {vehicle.currentKm ? (
          <FactChip icon={Gauge}>{vehicle.currentKm.toLocaleString('en-IN')} km</FactChip>
        ) : null}
        {insuranceOn && left !== null && (
          <FactChip
            icon={ShieldCheck}
            className={left <= EXPIRING_WITHIN_DAYS ? CHIP_WARN : CHIP_GOOD}
          >
            {left < 0
              ? `Insurance expired ${insuranceOn}`
              : left <= EXPIRING_WITHIN_DAYS
                ? `Insurance ends in ${spanLabel(left)}`
                : `Insured till ${insuranceOn}`}
          </FactChip>
        )}
      </div>
    </div>
  )
}

/**
 * What the customer row leaves out, opened under it by the row's arrow — one
 * sheet, so every part lines up on the same edges:
 *
 *   - a strip of how long they have been a customer, where their vehicles
 *     stand, and the ways to reach them the row does not show;
 *   - their notes, and a warning when a vehicle's insurance has run out or is
 *     about to;
 *   - each vehicle as a card.
 *
 * The row already carries the name, mobile number, vehicle count and city, so
 * none of that is repeated, and a detail never filled in is left out.
 */
export function CustomerMoreDetails({ customer }: CustomerMoreDetailsProps) {
  const vehicles = customer.vehicles ?? []
  const inService = vehicles.filter((v) => v.status === 'IN_SERVICE').length
  const pending = vehicles.filter((v) => v.status === 'PENDING').length
  const completed = vehicles.filter((v) => v.status === 'COMPLETED').length

  // WhatsApp is only worth showing when it is not the mobile number again.
  const whatsapp = customer.whatsappNumber?.trim()
  const separateWhatsapp = whatsapp && whatsapp !== customer.mobileNumber ? whatsapp : null
  const email = customer.email?.trim()
  const address = customer.address?.trim()
  const notes = customer.notes?.trim()
  const sinceDays = customer.createdAt ? daysBetween(customer.createdAt) : null

  // Vehicles whose insurance has run out, or will within the month.
  const insuranceAlerts = vehicles
    .map((vehicle) => ({ vehicle, left: insuranceDaysLeft(vehicle) }))
    .filter((a): a is { vehicle: VehicleSummary; left: number } =>
      a.left !== null && a.left <= EXPIRING_WITHIN_DAYS,
    )

  const statusLine = [
    pending && `${pending} pending`,
    completed && `${completed} completed`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <DetailSheet>
      <FactStrip>
        <FactCell
          icon={CalendarDays}
          label="Customer For"
          value={
            sinceDays === null ? '—' : sinceDays === 0 ? 'Joined today' : spanLabel(sinceDays)
          }
          sub={customer.createdAt ? `Since ${formatDate(customer.createdAt)}` : undefined}
        />
        <FactCell
          icon={Wrench}
          label="At The Garage"
          value={
            vehicles.length === 0
              ? 'No vehicles yet'
              : inService > 0
                ? `${inService} in service`
                : 'None in service'
          }
          sub={statusLine || undefined}
          tone={inService > 0 ? 'warn' : vehicles.length ? 'good' : 'muted'}
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
                onClick={(e) => e.stopPropagation()}
                className="block truncate text-primary-700 hover:underline"
              >
                {email}
              </a>
            }
          />
        )}
        {address && (
          <FactCell icon={MapPin} label="Address" value={address} sub={customer.city || undefined} />
        )}
      </FactStrip>

      {insuranceAlerts.length > 0 && (
        <SheetBand tone="warn">
          <p className="flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">Insurance to renew: </span>
              {insuranceAlerts
                .map(({ vehicle, left }) =>
                  left < 0
                    ? `${vehicle.vehicleNumber} expired ${insuranceDateLabel(vehicle.insuranceExpiry)}`
                    : `${vehicle.vehicleNumber} ends in ${spanLabel(left)}`,
                )
                .join(' · ')}
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

      <SheetSection icon={Car} title="Vehicles" className="border-t border-slate-100">
        {vehicles.length === 0 ? (
          <p className="text-sm italic text-slate-400">No vehicles for this customer yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </SheetSection>
    </DetailSheet>
  )
}
