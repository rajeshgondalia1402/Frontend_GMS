import { useEffect, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  /** One plain line under the title saying what the section is for. */
  description?: string
  icon?: ComponentType<{ className?: string }>
  /** Shown as a pill beside the title, e.g. "Optional". */
  badge?: string
  /**
   * Folds the section away behind its title — for the details that are nice
   * to have, so the few that matter are all the owner sees at first.
   */
  collapsible?: boolean
  defaultOpen?: boolean
  /** Opens a folded section, e.g. when one of its fields has an error. */
  forceOpen?: boolean
  children: ReactNode
  className?: string
}

/**
 * A titled group of form fields. Splitting a long form into "what we need"
 * and "extra details" is what makes it quick to fill in at the counter.
 */
export function FormSection({
  title,
  description,
  icon: Icon,
  badge,
  collapsible = false,
  defaultOpen = true,
  forceOpen = false,
  children,
  className,
}: FormSectionProps) {
  const [open, setOpen] = useState(collapsible ? defaultOpen : true)

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  const heading = (
    <div className="flex min-w-0 items-start gap-3">
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      )}
      <div className="min-w-0 text-left">
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900">
          {title}
          {badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {badge}
            </span>
          )}
        </p>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
    </div>
  )

  return (
    <section
      className={cn('rounded-xl border border-slate-200 bg-white shadow-card', className)}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 rounded-xl p-4 hover:bg-slate-50/70 sm:p-5"
        >
          {heading}
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary-600">
            <span className="hidden sm:inline">{open ? 'Hide' : 'Add'}</span>
            <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} />
          </span>
        </button>
      ) : (
        <div className="p-4 pb-0 sm:p-5 sm:pb-0">{heading}</div>
      )}

      {/* Kept mounted while folded, so the form keeps the values and rules. */}
      <div className={cn('px-4 pb-4 sm:px-5 sm:pb-5', !collapsible && 'pt-4', !open && 'hidden')}>
        {children}
      </div>
    </section>
  )
}
