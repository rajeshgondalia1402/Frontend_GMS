import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ChoiceOption {
  label: string
  value: string
}

interface ChoiceChipsProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  options: ChoiceOption[]
  /** The value currently picked — chips are styled from it. */
  selected?: string
  name: string
}

/**
 * A one-tap choice between a few options, as buttons rather than a dropdown —
 * faster with a thumb on a phone and every option is visible at once. Under
 * the hood these are radio inputs, so `register()` and its rules work as-is.
 */
export const ChoiceChips = forwardRef<HTMLInputElement, ChoiceChipsProps>(
  ({ label, error, hint, options, selected, name, className, ...props }, ref) => (
    <fieldset className={cn('w-full', className)}>
      {label && (
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">{label}</legend>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected === o.value
          return (
            <label
              key={o.value}
              className={cn(
                'relative inline-flex min-h-[40px] cursor-pointer select-none items-center rounded-lg border px-3.5 text-sm font-medium transition-colors',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-200',
                active
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : error
                    ? 'border-red-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <input
                ref={ref}
                type="radio"
                name={name}
                value={o.value}
                className="sr-only"
                {...props}
              />
              {o.label}
            </label>
          )
        })}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </fieldset>
  ),
)
ChoiceChips.displayName = 'ChoiceChips'
