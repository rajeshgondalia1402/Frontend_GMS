import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * What the action is for, which is what gives it its colour. A desk reads the
 * end of a row by colour before it reads the words: the money is green, the
 * paperwork is in the app's own blue, and opening the record itself is the
 * quiet one.
 */
export type ActionTone = 'primary' | 'money' | 'neutral'

/**
 * Where the button is being used. In a table row it is small and holds the
 * width it is given, so the actions line up down the table; on a card it is
 * taller and shares the width of the card with the others.
 */
export type ActionLayout = 'row' | 'card'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ActionTone
  layout?: ActionLayout
  /** Shown before the label, and replaced by a spinner while `loading`. */
  icon?: ReactNode
  loading?: boolean
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const LAYOUTS: Record<ActionLayout, string> = {
  row: 'h-8 shrink-0 px-1.5 text-xs',
  card: 'h-9 flex-1 px-2.5 text-sm',
}

const TONES: Record<ActionTone, string> = {
  primary:
    'border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100 focus-visible:ring-primary-500',
  money:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:ring-emerald-500',
  neutral:
    'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-slate-400',
}

/**
 * One action at the end of a row, or at the foot of a card.
 *
 * Drawn as a button — bordered, on its own fill — rather than as a coloured
 * word: a row of links reads as text the desk has to guess is clickable.
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    { tone = 'neutral', layout = 'row', icon, loading, className, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(BASE, LAYOUTS[layout], TONES[tone], className)}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  ),
)
ActionButton.displayName = 'ActionButton'
