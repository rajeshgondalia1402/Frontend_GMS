import { CarFront, ClipboardList, Clock, Gauge, MessageCircle, ShieldCheck } from 'lucide-react'
import { DetailSheet, FactCell, FactStrip, SheetBand } from '@/components/common'
import { agoLabel, formatDate } from '@/lib/utils'
import type { VehicleWithCustomer } from '@/types/vehicle'
import {
  insuranceDaysLeft,
  insuranceNeedsRenewal,
  insuranceText,
  vehicleMakeModel,
} from './VehicleFacts'

interface VehicleMoreDetailsProps {
  vehicle: VehicleWithCustomer
}

/**
 * What the vehicle row leaves out, opened under it by the row's arrow — one
 * sheet of the facts the row has no room for: the full make and model with its
 * type, fuel and colour, the reading on the clock, where the insurance stands
 * in days, how long ago it last came in, and what it came in for. The row
 * already carries the number, model, owner and status, so none of that is
 * repeated, and a fact never recorded is left out.
 */
export function VehicleMoreDetails({ vehicle }: VehicleMoreDetailsProps) {
  const makeModel = vehicleMakeModel(vehicle)
  // The type heads the cell when there is no make and model, so it is not
  // repeated in the line under it.
  const kind = [makeModel ? vehicle.vehicleType : null, vehicle.fuelType, vehicle.color]
    .filter(Boolean)
    .join(' · ')
  const insurance = insuranceText(vehicle.insuranceExpiry)
  const left = insuranceDaysLeft(vehicle.insuranceExpiry)
  const lastVisit = agoLabel(vehicle.createdAt)
  const complaint = vehicle.description?.trim()

  const owner = vehicle.customer
  const whatsapp = owner?.whatsappNumber?.trim()
  const separateWhatsapp = whatsapp && whatsapp !== owner?.mobileNumber ? whatsapp : null

  return (
    <DetailSheet>
      <FactStrip>
        <FactCell
          icon={CarFront}
          label="Vehicle"
          value={makeModel || vehicle.vehicleType || '—'}
          sub={kind || undefined}
        />
        {vehicle.currentKm ? (
          <FactCell
            icon={Gauge}
            label="Current KM"
            value={`${vehicle.currentKm.toLocaleString('en-IN')} km`}
          />
        ) : null}
        <FactCell
          icon={ShieldCheck}
          label="Insurance"
          value={
            insurance
              ? left !== null && left < 0
                ? 'Expired'
                : insuranceNeedsRenewal(vehicle.insuranceExpiry)
                  ? 'Due for renewal'
                  : 'Valid'
              : 'Not recorded'
          }
          sub={insurance ?? undefined}
          tone={
            !insurance ? 'muted' : insuranceNeedsRenewal(vehicle.insuranceExpiry) ? 'warn' : 'good'
          }
        />
        {lastVisit && vehicle.createdAt && (
          <FactCell
            icon={Clock}
            label="Last Visit"
            value={lastVisit}
            sub={formatDate(vehicle.createdAt)}
          />
        )}
        {separateWhatsapp && (
          <FactCell icon={MessageCircle} label="Owner WhatsApp" value={separateWhatsapp} />
        )}
      </FactStrip>

      {complaint && (
        <SheetBand>
          <p className="flex items-start gap-2 text-sm text-slate-700">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="whitespace-pre-line">{complaint}</span>
          </p>
        </SheetBand>
      )}
    </DetailSheet>
  )
}
