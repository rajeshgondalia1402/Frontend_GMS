import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The building blocks of the "more details" panel a list row opens under
 * itself. Each block reads differently — specs as tiles, conditions as a
 * checklist with a verdict per line, contact details as icon lines — so the
 * eye can find a fact without reading every label.
 */

/** A titled card, with its own heading and icon. */
export function DetailPanel({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  /** Shown at the right of the heading — a summary figure, say. */
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-card',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Icon className="h-4 w-4 text-primary-600" />
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  )
}

/** One fact as a small tile: icon, name, value. */
export function SpecTile({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
      {/* On a phone the tile is too narrow for both, and the value matters more. */}
      <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 ring-1 ring-slate-200 sm:flex">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {/* Wraps rather than cutting off a long value like "Midnight Blue". */}
        <div className="break-words text-sm font-semibold leading-snug text-slate-800">
          {children}
        </div>
      </div>
    </div>
  )
}

/** The tiles, two across, stretched to the panel's height so a row ends level. */
export function SpecGrid({ children }: { children: ReactNode }) {
  return <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2">{children}</div>
}

export type StatusTone = 'good' | 'warn' | 'bad' | 'none'

const STATUS_TONES: Record<StatusTone, { icon: string; pill: string }> = {
  good: {
    icon: 'bg-emerald-50 text-emerald-600',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  warn: { icon: 'bg-amber-50 text-amber-600', pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
  bad: { icon: 'bg-red-50 text-red-600', pill: 'bg-red-50 text-red-700 ring-red-200' },
  none: { icon: 'bg-slate-100 text-slate-500', pill: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

/** A verdict pill on its own — Valid, Pending, Paid. */
export function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        STATUS_TONES[tone].pill,
      )}
    >
      {children}
    </span>
  )
}

/** A checklist of status rows, divided by hairlines. */
export function StatusList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-slate-100">{children}</ul>
}

/** One line of a checklist: what it is, the detail under it, and its verdict. */
export function StatusRow({
  icon: Icon,
  label,
  detail,
  status,
  tone,
}: {
  icon: LucideIcon
  label: string
  detail: string
  status: string
  tone: StatusTone
}) {
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          STATUS_TONES[tone].icon,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="truncate text-xs text-slate-500">{detail}</p>
      </div>
      <StatusPill tone={tone}>{status}</StatusPill>
    </li>
  )
}

/** One contact or record line: icon, then the value with its name above. */
export function InfoLine({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="break-words text-sm font-medium text-slate-800">{children}</div>
      </div>
    </div>
  )
}

/** A tap-to-call number, set beside a name. Does not open the row it sits in. */
export function PhoneLink({ number, icon }: { number: string; icon: ReactNode }) {
  return (
    <a
      href={`tel:${number}`}
      onClick={(e) => e.stopPropagation()}
      className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
    >
      {icon}
      {number}
    </a>
  )
}

/**
 * One sheet holding a record's details — a single bordered card, with its parts
 * divided by hairlines rather than floated as separate boxes, so everything in
 * it lines up on the same edges whatever each part holds.
 */
export function DetailSheet({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      {children}
    </div>
  )
}

/** A row of equal cells across the top of a sheet, wrapping as the width shrinks. */
export function FactStrip({ children }: { children: ReactNode }) {
  return (
    // Each cell draws its own right and bottom hairline, and the outer edge
    // clips the ones along the sheet's border — so a row left short by an odd
    // number of cells ends in white, not a grey block.
    <div className="overflow-hidden">
      {/* Two across on a phone, as many as fit from there up. */}
      <div className="-mb-px -mr-px grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] [&>*]:border-b [&>*]:border-r [&>*]:border-slate-100">
        {children}
      </div>
    </div>
  )
}

/** One cell of a fact strip: icon, name, the value, and a line under it. */
export function FactCell({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'primary',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'primary' | 'good' | 'warn' | 'muted'
}) {
  const iconTone = {
    primary: 'bg-primary-50 text-primary-600',
    good: 'bg-emerald-50 text-emerald-600',
    warn: 'bg-amber-50 text-amber-600',
    muted: 'bg-slate-100 text-slate-500',
  }[tone]

  return (
    <div className="flex min-w-0 items-start gap-3 bg-white p-3 sm:p-3.5">
      {/* A phone's half-width cell has room for the value, not the icon too. */}
      <span
        className={cn(
          'hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex',
          iconTone,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="break-words text-sm font-semibold text-slate-900">{value}</div>
        {sub && <div className="mt-0.5 break-words text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  )
}

/** A band across a sheet — chips, a note or a warning — under a hairline. */
export function SheetBand({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: 'plain' | 'warn'
}) {
  return (
    <div
      className={cn(
        'border-t px-3.5 py-2.5',
        tone === 'warn' ? 'border-amber-100 bg-amber-50/70' : 'border-slate-100 bg-white',
      )}
    >
      {children}
    </div>
  )
}

/** A titled part of a sheet's body, the heading in the panels' small caps. */
export function SheetSection({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('min-w-0 p-3.5', className)}>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Icon className="h-4 w-4 text-primary-600" />
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A small fact as a chip; a coloured one brings its own fill. */
export function FactChip({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        className ?? 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {children}
    </span>
  )
}

/** The fills for a good and a warning chip, to hand to `FactChip`. */
export const CHIP_GOOD = 'bg-emerald-50 text-emerald-700 ring-emerald-200'
export const CHIP_WARN = 'bg-amber-50 text-amber-700 ring-amber-200'

/** A value that was never filled in, said in words rather than with a dash. */
export function NotAdded({ children = 'Not added' }: { children?: ReactNode }) {
  return <span className="text-slate-400">{children}</span>
}
