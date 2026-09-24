import {
  AlertTriangle,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Fuel,
  IndianRupee,
  MapPin,
  Palette,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import {
  DetailPanel,
  InfoLine,
  NotAdded,
  PhoneLink,
  SpecGrid,
  SpecTile,
  StatusList,
  StatusRow,
} from '@/components/common'
import { formatDate } from '@/lib/utils'
import {
  carOwnerLabel,
  insuranceDateLabel,
  isInsuranceExpired,
  sellingPriceLabel,
} from '@/lib/carSelling'
import type { CarSellingRecord } from '@/types/carSelling'

interface CarSellingMoreDetailsProps {
  car: CarSellingRecord
}

/**
 * A CSS colour for a colour's name where the browser knows one — "White",
 * "Midnight Blue" (read as blue), "Pearl White" (read as white) — or `null`.
 */
function swatchColor(name: string | null): string | null {
  if (!name || typeof CSS === 'undefined' || !CSS.supports) return null
  const words = name.trim().toLowerCase().split(/\s+/)
  for (const candidate of [words.join(''), words[words.length - 1]]) {
    if (CSS.supports('color', candidate)) return candidate
  }
  return null
}

/** The insurance line, read the way the list's badges read it. */
function insuranceStatus(car: CarSellingRecord) {
  const till = insuranceDateLabel(car.insuranceDate)
  if (!car.insurance) {
    return { detail: 'No insurance on this car', status: 'Not insured', tone: 'none' as const }
  }
  if (isInsuranceExpired(car.insuranceDate)) {
    return { detail: `Expired on ${till}`, status: 'Expired', tone: 'warn' as const }
  }
  return {
    detail: till ? `Valid till ${till}` : 'Valid-till date not added',
    status: 'Valid',
    tone: 'good' as const,
  }
}

/**
 * Everything the list row leaves out, opened under it by the row's arrow. Laid
 * out as three panels that each read differently — the car's specs as tiles,
 * its papers and condition as a checklist with a verdict per line, and the
 * seller with the listing — with the description, when there is one, in full
 * under them.
 */
export function CarSellingMoreDetails({ car }: CarSellingMoreDetailsProps) {
  const insurance = insuranceStatus(car)
  const swatch = swatchColor(car.carColor)
  const price = sellingPriceLabel(car.sellingPrice)

  return (
    <div className="space-y-3 py-1">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DetailPanel icon={CarFront} title="Car Specs">
          <SpecGrid>
            <SpecTile icon={CalendarDays} label="Year">
              {car.yearOfVehicle ?? '—'}
            </SpecTile>
            <SpecTile icon={Fuel} label="Fuel">
              {car.fuelType || '—'}
            </SpecTile>
            <SpecTile icon={Palette} label="Color">
              <span className="flex items-start gap-1.5">
                {swatch && (
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-slate-300"
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                  />
                )}
                <span>{car.carColor || '—'}</span>
              </span>
            </SpecTile>
            <SpecTile icon={Users} label="Ownership">
              {carOwnerLabel(car.carOwner) ?? '—'}
            </SpecTile>
          </SpecGrid>
        </DetailPanel>

        <DetailPanel icon={ClipboardCheck} title="Papers & Condition">
          <StatusList>
            <StatusRow
              icon={ShieldCheck}
              label="Insurance"
              detail={insurance.detail}
              status={insurance.status}
              tone={insurance.tone}
            />
            <StatusRow
              icon={FileCheck2}
              label="PUC"
              detail={car.puc ? 'Pollution certificate in place' : 'No pollution certificate'}
              status={car.puc ? 'Valid' : 'Missing'}
              tone={car.puc ? 'good' : 'none'}
            />
            <StatusRow
              icon={AlertTriangle}
              label="Accident History"
              detail={car.isAccidental ? 'Has been in an accident' : 'No accident reported'}
              status={car.isAccidental ? 'Accidental' : 'Clean'}
              tone={car.isAccidental ? 'bad' : 'good'}
            />
          </StatusList>
        </DetailPanel>

        <DetailPanel icon={User} title="Seller & Listing" className="md:col-span-2 xl:col-span-1">
          {price && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700">
                <IndianRupee className="h-3.5 w-3.5" />
                Asking Price
              </span>
              <span className="text-base font-bold text-primary-700">{price}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoLine icon={User} label="Seller">
              {car.ownerName}
              <PhoneLink number={car.mobileNumber} icon={<Phone className="h-3 w-3" />} />
            </InfoLine>
            <InfoLine icon={MapPin} label="Address">
              {car.address || <NotAdded />}
            </InfoLine>
            <InfoLine icon={CalendarDays} label="Listed On">
              {car.createdAt ? formatDate(car.createdAt) : '—'}
            </InfoLine>
          </div>
        </DetailPanel>
      </div>

      <DetailPanel icon={FileText} title="Description">
        {car.description ? (
          <p className="whitespace-pre-line border-l-2 border-primary-200 pl-3 text-sm leading-relaxed text-slate-700">
            {car.description}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">No description added for this car.</p>
        )}
      </DetailPanel>
    </div>
  )
}
