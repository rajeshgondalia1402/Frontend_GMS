import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RegisterStep = 'mobile' | 'otp' | 'details'

const STEPS: { key: RegisterStep; label: string }[] = [
  { key: 'mobile', label: 'Mobile' },
  { key: 'otp', label: 'Verify OTP' },
  { key: 'details', label: 'Garage Details' },
]

/** 1 Mobile — 2 Verify OTP — 3 Garage Details, with the finished ones ticked. */
export function RegisterStepIndicator({ current }: { current: RegisterStep }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current)

  return (
    <ol className="mb-7 flex items-center rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-100" aria-label="Registration steps">
      {STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <li key={step.key} className={cn('flex items-center', index < STEPS.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-emerald-500 text-white',
                  active && 'bg-primary-600 text-white ring-4 ring-primary-100',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px] font-medium',
                  active ? 'text-primary-700' : done ? 'text-emerald-600' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={cn('mx-1.5 mb-5 h-0.5 flex-1 rounded-full', done ? 'bg-emerald-400' : 'bg-slate-200')}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
