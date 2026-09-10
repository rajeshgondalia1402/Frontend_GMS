import { cn } from '@/lib/utils'
import { PAYMENT_METHOD_OPTIONS } from '@/lib/payment'
import type { PaymentMethod } from '@/types/payment'

interface PaymentMethodPickerProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  /** Grey the whole row out while a receipt is being saved. */
  disabled?: boolean
}

/**
 * How the money was taken, as a row of tiles rather than a dropdown: the desk
 * taps this while the customer is standing there, so the five ways a garage
 * gets paid are all on screen at once instead of behind a list.
 *
 * A real radio group underneath, so it is one stop in the tab order, the arrow
 * keys move between the tiles and a screen reader reads it as a choice.
 */
export function PaymentMethodPicker({ value, onChange, disabled }: PaymentMethodPickerProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">Payment Method *</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {PAYMENT_METHOD_OPTIONS.map((option) => {
          const Icon = option.icon
          const active = option.value === value

          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-colors',
                'focus-within:ring-2 focus-within:ring-primary-100',
                active
                  ? option.accent
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold leading-tight sm:text-xs">
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
