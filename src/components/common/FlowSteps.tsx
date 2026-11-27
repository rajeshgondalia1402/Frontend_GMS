import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowStepsProps {
  /** Labels in order, e.g. Customer → Vehicle → Done. */
  steps: string[]
  /** 0-based index of the step the owner is on. */
  current: number
  className?: string
}

/**
 * A small "where am I" strip for a multi-step task, so the owner always sees
 * that adding a customer is followed by adding their vehicle, and how far
 * along they are. Labels stay visible on a phone — the steps are short words.
 */
export function FlowSteps({ steps, current, className }: FlowStepsProps) {
  return (
    <ol
      className={cn(
        'mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-card sm:gap-3 sm:p-4',
        className,
      )}
      aria-label="Progress"
    >
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={label}
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm',
                done && 'bg-emerald-500 text-white',
                active && 'bg-primary-600 text-white ring-4 ring-primary-100',
                !done && !active && 'bg-slate-100 text-slate-400',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'truncate text-xs font-medium sm:text-sm',
                active ? 'text-slate-900' : done ? 'text-emerald-700' : 'text-slate-400',
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'hidden h-0.5 flex-1 rounded-full sm:block',
                  done ? 'bg-emerald-300' : 'bg-slate-200',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
