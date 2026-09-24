import {
  BadgeIndianRupee,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  Hash,
  Info,
  MapPin,
  Pencil,
  Phone,
  Tag,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import {
  ActionButton,
  DetailPanel,
  InfoLine,
  NotAdded,
  PhoneLink,
  SpecGrid,
  SpecTile,
  StatusList,
  StatusPill,
  StatusRow,
} from '@/components/common'
import type { StatusTone } from '@/components/common'
import { cn, formatDate } from '@/lib/utils'
import {
  amountLabel,
  carSoldDateLabel,
  paidPercent,
  paymentStatusLabel,
} from '@/lib/carSold'
import type { CarSoldCustomerRecord, CarSoldPayment, SoldCarRecord } from '@/types/carSold'

interface SoldCarMoreDetailsProps {
  car: SoldCarRecord
  /** Opens the correction dialog for one receipt; no Edit buttons without it. */
  onEditPayment?: (payment: CarSoldPayment) => void
}

/** Where the money stands, as a checklist line. */
function paymentLine(sale: CarSoldCustomerRecord) {
  const tone: StatusTone =
    sale.paymentStatus === 'PAID' ? 'good' : sale.paidAmount > 0 ? 'warn' : 'bad'
  return {
    detail: `${amountLabel(sale.paidAmount)} of ${amountLabel(sale.finalSellingPrice)} paid`,
    status: paymentStatusLabel(sale),
    tone,
  }
}

/** Whether the buyer has taken the car, as a checklist line. */
function deliveryLine(sale: CarSoldCustomerRecord) {
  if (sale.deliveredStatus === 'DELIVERED') {
    const on = carSoldDateLabel(sale.deliveredDate)
    return {
      detail: on ? `Handed over on ${on}` : 'Handed over to the buyer',
      status: 'Delivered',
      tone: 'good' as const,
    }
  }
  return { detail: 'Waiting for the buyer to collect', status: 'Pending', tone: 'warn' as const }
}

/** How the deal closed against the asking price, as a checklist line. */
function dealLine(car: SoldCarRecord, sale: CarSoldCustomerRecord) {
  const asking = car.sellingPrice
  const final = sale.finalSellingPrice
  if (!asking) {
    return { detail: `Sold for ${amountLabel(final)}`, status: 'Final', tone: 'none' as const }
  }
  const detail = `Asked ${amountLabel(asking)} · Sold ${amountLabel(final)}`
  if (final < asking) {
    return { detail, status: `${amountLabel(asking - final)} off`, tone: 'none' as const }
  }
  return {
    detail,
    status: final > asking ? 'Above asking' : 'At asking',
    tone: 'good' as const,
  }
}

/** One figure of the money strip over the payments. */
function MoneyFigure({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn('mt-0.5 text-base font-bold', className)}>{value}</p>
    </div>
  )
}

/**
 * Everything the sold row leaves out, opened under it by the row's arrow, in
 * the same panels as the selling board's details: the car as tiles, the sale's
 * standing as a checklist, the people on either side of the deal, and every
 * receipt taken against it — each correctable when `onEditPayment` is given.
 * A cancelled receipt never reaches here — the API leaves it out of both the
 * list and the totals.
 */
export function SoldCarMoreDetails({ car, onEditPayment }: SoldCarMoreDetailsProps) {
  const sale = car.soldCustomerDetail
  const title = [car.companyName, car.carType].filter(Boolean).join(' ')

  const carPanel = (
    <DetailPanel icon={CarFront} title="Car">
      <SpecGrid>
        <SpecTile icon={Hash} label="Car Number">
          {car.carNumber ?? '—'}
        </SpecTile>
        <SpecTile icon={CarFront} label="Car">
          {title || '—'}
        </SpecTile>
        <SpecTile icon={CalendarDays} label="Year">
          {car.yearOfVehicle ?? '—'}
        </SpecTile>
        <SpecTile icon={Tag} label="Asking Price">
          {amountLabel(car.sellingPrice)}
        </SpecTile>
      </SpecGrid>
    </DetailPanel>
  )

  // Marked sold by hand, with no buyer recorded: only the car and its seller.
  if (!sale) {
    return (
      <div className="grid grid-cols-1 gap-3 py-1 md:grid-cols-2">
        {carPanel}
        <DetailPanel icon={Users} title="Seller">
          <div className="space-y-3">
            <InfoLine icon={User} label="Seller">
              {car.ownerName}
              <PhoneLink number={car.mobileNumber} icon={<Phone className="h-3 w-3" />} />
            </InfoLine>
            <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              This car was marked sold without a buyer being recorded, so there is no deal and no
              payment history behind it.
            </div>
          </div>
        </DetailPanel>
      </div>
    )
  }

  const payment = paymentLine(sale)
  const delivery = deliveryLine(sale)
  const deal = dealLine(car, sale)
  const percent = paidPercent(sale)

  return (
    <div className="space-y-3 py-1">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {carPanel}

        <DetailPanel icon={ClipboardCheck} title="Sale Status">
          <StatusList>
            <StatusRow
              icon={Wallet}
              label="Payment"
              detail={payment.detail}
              status={payment.status}
              tone={payment.tone}
            />
            <StatusRow
              icon={Truck}
              label="Delivery"
              detail={delivery.detail}
              status={delivery.status}
              tone={delivery.tone}
            />
            <StatusRow
              icon={BadgeIndianRupee}
              label="Deal"
              detail={deal.detail}
              status={deal.status}
              tone={deal.tone}
            />
          </StatusList>
        </DetailPanel>

        <DetailPanel icon={Users} title="Buyer & Seller" className="md:col-span-2 xl:col-span-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoLine icon={User} label="Buyer">
              {sale.purchaseOwnerName}
              <PhoneLink number={sale.purchaseOwnerMobileNo} icon={<Phone className="h-3 w-3" />} />
            </InfoLine>
            <InfoLine icon={MapPin} label="Buyer Address">
              {sale.purchaseOwnerAddress || <NotAdded />}
            </InfoLine>
            <InfoLine icon={User} label="Seller">
              {car.ownerName}
              <PhoneLink number={car.mobileNumber} icon={<Phone className="h-3 w-3" />} />
            </InfoLine>
            <InfoLine icon={CalendarDays} label="Sold On">
              {sale.createdAt
                ? formatDate(sale.createdAt)
                : car.createdAt
                  ? formatDate(car.createdAt)
                  : '—'}
            </InfoLine>
          </div>
        </DetailPanel>
      </div>

      <DetailPanel
        icon={Wallet}
        title="Payments"
        action={
          <StatusPill tone={payment.tone}>
            {sale.paymentStatus === 'PAID' ? 'Fully paid' : `${percent}% paid`}
          </StatusPill>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <MoneyFigure
            label="Final Price"
            value={amountLabel(sale.finalSellingPrice)}
            className="text-slate-900"
          />
          <MoneyFigure label="Paid" value={amountLabel(sale.paidAmount)} className="text-emerald-600" />
          <MoneyFigure
            label="Pending"
            value={amountLabel(sale.remainingAmount)}
            className={sale.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-400'}
          />
        </div>

        {/* How far through paying the buyer is, at a glance. */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              sale.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500',
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        {sale.payments.length === 0 ? (
          <p className="mt-3 text-sm italic text-slate-400">
            Nothing has been collected against this sale yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
            {sale.payments.map((p, index) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {amountLabel(p.paymentAmount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Received{' '}
                    {carSoldDateLabel(p.createdDate) ??
                      (p.createdDate ? formatDate(p.createdDate) : '—')}
                  </p>
                </div>
                {onEditPayment && (
                  <ActionButton
                    tone="neutral"
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    title="Correct this payment's amount"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditPayment(p)
                    }}
                  >
                    Edit
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </DetailPanel>
    </div>
  )
}
