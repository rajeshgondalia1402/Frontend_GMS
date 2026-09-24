import { Car, Fuel, Gauge, Palette, ShieldCheck } from 'lucide-react'
import { CHIP_GOOD, CHIP_WARN, FactChip } from '@/components/common'
import { insuranceDateLabel } from '@/lib/carSelling'
import { daysBetween, spanLabel } from '@/lib/utils'
import type { VehicleSummary } from '@/types/vehicle'

/** Insurance within this many days of running out is flagged as expiring. */
export const INSURANCE_EXPIRING_WITHIN_DAYS = 30

/** Days until a vehicle's insurance runs out — negative once it has — or `null`. */
export function insuranceDaysLeft(expiry: string | null | undefined): number | null {
  if (!expiry) return null
  // The date comes at midnight UTC; only its date part means anything.
  return daysBetween(new Date(), `${expiry.slice(0, 10)}T00:00:00`)
}

/** True when the insurance has run out, or will within the month. */
export function insuranceNeedsRenewal(expiry: string | null | undefined): boolean {
  const left = insuranceDaysLeft(expiry)
  return left !== null && left <= INSURANCE_EXPIRING_WITHIN_DAYS
}

/** "Insured till 10-Mar-2027", "Insurance ends in 11 days" or "…expired 01-Feb-2026". */
export function insuranceText(expiry: string | null | undefined): string | null {
  const on = insuranceDateLabel(expiry)
  const left = insuranceDaysLeft(expiry)
  if (!on || left === null) return null
  if (left < 0) return `Insurance expired ${on}`
  if (left === 0) return 'Insurance ends today'
  if (left <= INSURANCE_EXPIRING_WITHIN_DAYS) return `Insurance ends in ${spanLabel(left)}`
  return `Insured till ${on}`
}

/** The insurance as a chip — green while valid, amber once due or expired. */
export function InsuranceChip({ expiry }: { expiry: string | null | undefined }) {
  const text = insuranceText(expiry)
  if (!text) return null
  return (
    <FactChip icon={ShieldCheck} className={insuranceNeedsRenewal(expiry) ? CHIP_WARN : CHIP_GOOD}>
      {text}
    </FactChip>
  )
}

/** The make, model and variant, or an empty string when none was recorded. */
export function vehicleMakeModel(vehicle: Pick<VehicleSummary, 'brand' | 'model' | 'variant'>): string {
  return [vehicle.brand, vehicle.model, vehicle.variant]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * A vehicle's facts as chips — type, fuel, colour, KM and insurance — each only
 * when recorded. `skipType` leaves the type out where it already stands in for
 * the make and model, so it is not said twice.
 */
export function VehicleChips({
  vehicle,
  skipType = false,
}: {
  vehicle: VehicleSummary
  skipType?: boolean
}) {
  const km = vehicle.currentKm ? `${vehicle.currentKm.toLocaleString('en-IN')} km` : null
  const any =
    (!skipType && vehicle.vehicleType) ||
    vehicle.fuelType ||
    vehicle.color ||
    km ||
    insuranceText(vehicle.insuranceExpiry)
  if (!any) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {!skipType && vehicle.vehicleType && <FactChip icon={Car}>{vehicle.vehicleType}</FactChip>}
      {vehicle.fuelType && <FactChip icon={Fuel}>{vehicle.fuelType}</FactChip>}
      {vehicle.color && <FactChip icon={Palette}>{vehicle.color}</FactChip>}
      {km && <FactChip icon={Gauge}>{km}</FactChip>}
      <InsuranceChip expiry={vehicle.insuranceExpiry} />
    </div>
  )
}
