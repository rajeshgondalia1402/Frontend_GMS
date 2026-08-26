import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  hint?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const boxId = id || props.name
    return (
      <div className="w-full">
        <label
          htmlFor={boxId}
          className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-700"
        >
          <input
            ref={ref}
            id={boxId}
            type="checkbox"
            className={cn(
              'h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-100',
              className,
            )}
            {...props}
          />
          {label}
        </label>
        {hint && <p className="mt-1.5 pl-[26px] text-xs text-slate-500">{hint}</p>}
      </div>
    )
  },
)
Checkbox.displayName = 'Checkbox'
