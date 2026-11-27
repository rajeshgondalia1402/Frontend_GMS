import type { ComponentType } from 'react'
import {
  Banknote,
  CheckCircle2,
  CircleDashed,
  Clock,
  HandCoins,
  PackageCheck,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VehicleStatus } from '@/types/vehicle'
import type { JobCardStatus, JobPaymentStatus } from '@/types/jobCard'

/** One status, explained the way you would explain it at the counter. */
interface StatusInfo {
  label: string
  icon: ComponentType<{ className?: string }>
  /** Tailwind colour for the icon and the highlighted step. */
  color: string
  /** One short line: what has happened. */
  meaning: string
  /** What the garage does next. */
  next: string
}

/* ------------------------------------------------------------------ */
/* Vehicle                                                            */
/* ------------------------------------------------------------------ */

export const VEHICLE_STATUS_INFO: Record<VehicleStatus, StatusInfo> = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600',
    meaning: 'The vehicle is registered, but no job card has been made for it yet.',
    next: 'Next: create a job card to start the work.',
  },
  IN_SERVICE: {
    label: 'In Service',
    icon: Wrench,
    color: 'text-sky-600',
    meaning: 'A job card has been created — the vehicle is in the garage and work is going on.',
    next: 'Next: finish the work, collect payment and deliver the vehicle.',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    meaning: 'Work is finished, the vehicle is delivered to the customer and payment is done.',
    next: 'Nothing left to do. Use "Add" when the vehicle comes back for a new visit.',
  },
}

const VEHICLE_ORDER: VehicleStatus[] = ['PENDING', 'IN_SERVICE', 'COMPLETED']

/* ------------------------------------------------------------------ */
/* Job card (where the vehicle is) and payment (where the money is)   */
/* ------------------------------------------------------------------ */

export const JOB_CARD_STATUS_INFO: Record<JobCardStatus, StatusInfo> = {
  PENDING: {
    label: 'Pending',
    icon: Wrench,
    color: 'text-amber-600',
    meaning: 'The vehicle is still with the garage — it has not been delivered to the customer yet.',
    next: 'Next: finish the work, collect the payment, then mark it Delivered.',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: PackageCheck,
    color: 'text-emerald-600',
    meaning: 'The vehicle has been handed back to the customer. This job is closed.',
    next: 'Nothing left to do on this job card.',
  },
}

export const PAYMENT_STATUS_INFO: Record<JobPaymentStatus, StatusInfo> = {
  UNPAID: {
    label: 'Unpaid',
    icon: CircleDashed,
    color: 'text-red-600',
    meaning: 'No money has been received yet — not a single payment is recorded.',
    next: 'Next: tap "Payment" to record what the customer pays.',
  },
  PARTIAL: {
    label: 'Partial Paid',
    icon: HandCoins,
    color: 'text-amber-600',
    meaning: 'Part of the bill is paid, but some amount is still due from the customer.',
    next: 'Next: collect the balance and record it under "Payment".',
  },
  PAID: {
    label: 'Paid',
    icon: Banknote,
    color: 'text-emerald-600',
    meaning: 'The full bill is paid. Nothing is due from the customer.',
    next: 'All money received.',
  },
}

/** The three ways a job card usually reads, from start to finish. */
const JOB_CARD_STAGES: {
  status: JobCardStatus
  payment: JobPaymentStatus
  text: string
}[] = [
  { status: 'PENDING', payment: 'UNPAID', text: 'Work going on, no payment yet' },
  { status: 'PENDING', payment: 'PARTIAL', text: 'Work going on, part payment received' },
  { status: 'DELIVERED', payment: 'PAID', text: 'Vehicle delivered, full payment done' },
]

/* ------------------------------------------------------------------ */
/* Bubble contents                                                    */
/* ------------------------------------------------------------------ */

function Heading({ kind, info }: { kind: string; info: StatusInfo }) {
  const Icon = info.icon
  return (
    <div className="flex items-start gap-2.5 pr-6 sm:pr-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
        <Icon className={cn('h-[18px] w-[18px]', info.color)} />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{kind}</p>
        <p className="text-sm font-semibold text-slate-900">{info.label}</p>
      </div>
    </div>
  )
}

function Body({ info }: { info: StatusInfo }) {
  return (
    <>
      <p className="mt-2 leading-snug text-slate-700">{info.meaning}</p>
      <p className="mt-1.5 text-xs font-medium text-primary-700">{info.next}</p>
    </>
  )
}

/** Vehicle status, with the 3-step journey and the current step marked. */
export function VehicleStatusHelp({ status }: { status: VehicleStatus }) {
  const info = VEHICLE_STATUS_INFO[status]
  if (!info) return <p>{status}</p>
  const at = VEHICLE_ORDER.indexOf(status)

  return (
    <div>
      <Heading kind="Vehicle status" info={info} />
      <Body info={info} />

      <ol className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
        {VEHICLE_ORDER.map((s, i) => {
          const step = VEHICLE_STATUS_INFO[s]
          const Icon = step.icon
          const here = i === at
          return (
            <li
              key={s}
              className={cn(
                'flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs',
                here ? 'bg-primary-50 ring-1 ring-primary-200' : i < at ? 'opacity-70' : 'opacity-50',
              )}
            >
              <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', step.color)} />
              <span>
                <span className="font-semibold text-slate-900">
                  {i + 1}. {step.label}
                </span>
                <span className="text-slate-600"> — {SHORT_VEHICLE[s]}</span>
                {here && <span className="ml-1 font-semibold text-primary-700">(now)</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const SHORT_VEHICLE: Record<VehicleStatus, string> = {
  PENDING: 'job card not created',
  IN_SERVICE: 'job card created, work going on',
  COMPLETED: 'delivered & payment done',
}

/** The three usual job card stages, with the one matching this card marked. */
function JobCardStages({
  status,
  payment,
}: {
  status?: JobCardStatus
  payment?: JobPaymentStatus
}) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        How a job card moves
      </p>
      <ol className="space-y-1.5">
        {JOB_CARD_STAGES.map((stage, i) => {
          const here = stage.status === status && stage.payment === payment
          return (
            <li
              key={i}
              className={cn(
                'rounded-lg px-2 py-1.5 text-xs',
                here ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-slate-50',
              )}
            >
              <span className="font-semibold text-slate-900">
                {i + 1}. {JOB_CARD_STATUS_INFO[stage.status].label} +{' '}
                {PAYMENT_STATUS_INFO[stage.payment].label}
              </span>
              {here && <span className="ml-1 font-semibold text-primary-700">(this one)</span>}
              <span className="block text-slate-600">{stage.text}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Job card status (where the vehicle is), plus the usual stages. */
export function JobCardStatusHelp({
  status,
  payment,
}: {
  status: JobCardStatus
  payment?: JobPaymentStatus
}) {
  const info = JOB_CARD_STATUS_INFO[status]
  if (!info) return <p>{status}</p>
  return (
    <div>
      <Heading kind="Job card status" info={info} />
      <Body info={info} />
      <JobCardStages status={status} payment={payment} />
    </div>
  )
}

/** Payment status (where the money is), plus the usual stages. */
export function PaymentStatusHelp({
  payment,
  status,
}: {
  payment: JobPaymentStatus
  status?: JobCardStatus
}) {
  const info = PAYMENT_STATUS_INFO[payment]
  if (!info) return <p>{payment}</p>
  return (
    <div>
      <Heading kind="Payment status" info={info} />
      <Body info={info} />
      <JobCardStages status={status} payment={payment} />
    </div>
  )
}
