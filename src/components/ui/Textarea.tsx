import { forwardRef } from 'react'
import type { ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  /** Field icon, shown inside the box at the first line. */
  leftIcon?: ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, leftIcon, id, rows = 3, ...props }, ref) => {
    const areaId = id || props.name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
              {leftIcon}
            </span>
          )}
          <textarea
            ref={ref}
            id={areaId}
            rows={rows}
            className={cn(
              'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2',
              Boolean(leftIcon) && 'pl-10',
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-slate-300 focus:border-primary-400 focus:ring-primary-100',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
