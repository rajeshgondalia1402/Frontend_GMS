import { useEffect, useRef, useState } from 'react'
import type { InputHTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import { Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui'
import { cn } from '@/lib/utils'

/** One row of the suggestion list. */
export interface ComboOption {
  id: string
  /** The leading value — what the box itself ends up holding. */
  title: string
  /** The supporting value, shown to the right of it. */
  meta?: string
  /** Render the title in the mono face — for numbers. */
  monoTitle?: boolean
  /** Render the meta in the mono face. */
  monoMeta?: boolean
}

type InputAttrs = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSelect'>

export interface ComboboxInputProps extends InputAttrs {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: ComboOption[]
  onPick: (option: ComboOption) => void
  /**
   * Open state is the caller's, so a box that loads its rows on demand knows
   * when the list is actually being looked at.
   */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Show the list on focus, before anything has been typed. */
  openOnFocus?: boolean
  loading?: boolean
  /** Shown in place of the rows when the list could not be loaded. */
  listError?: string | null
  /** Shown in place of the rows when there are none. */
  emptyLabel: string
  /**
   * True while the box holds a saved record rather than typed text. Focusing it
   * then selects the whole value, so a wrong pick is typed straight over
   * instead of leaving a full box that appears to refuse every keystroke.
   */
  selected?: boolean
  error?: string
  rightSlot?: ReactNode
  /** Field icon, shown inside the box on the left. */
  leftIcon?: ReactNode
}

/**
 * A text box with a suggestion list under it: type to narrow it, click or use
 * the arrow keys to pick, Escape or a click outside to dismiss. Where the rows
 * come from — an API per keystroke, or a list already in hand — is the
 * caller's business.
 */
export function ComboboxInput({
  label,
  value,
  onValueChange,
  options,
  onPick,
  open,
  onOpenChange,
  openOnFocus = false,
  loading = false,
  listError = null,
  emptyLabel,
  selected = false,
  error,
  rightSlot,
  leftIcon,
  ...inputProps
}: ComboboxInputProps) {
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  /** Set between the focus and the mouse-up of the click that caused it. */
  const selectingOnFocus = useRef(false)

  // Clicking away is a dismissal, whether or not the box keeps the focus.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onOpenChange])

  // A fresh list always starts from its first row.
  useEffect(() => setHighlight(0), [options])

  const choose = (option: ComboOption) => {
    onPick(option)
    onOpenChange(false)
  }

  /** Empties the box and hands the focus back, ready to search again. */
  const clear = () => {
    onValueChange('')
    onOpenChange(false)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      // Inside a dialog, the first Escape closes only the list, not the dialog.
      if (open) event.stopPropagation()
      onOpenChange(false)
      return
    }
    if (event.key === 'ArrowDown' && !open) {
      onOpenChange(true)
      return
    }
    if (!open || options.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((prev) => (prev + 1) % options.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((prev) => (prev - 1 + options.length) % options.length)
    } else if (event.key === 'Enter') {
      // Enter picks the highlighted row rather than submitting the job card.
      event.preventDefault()
      choose(options[highlight])
    }
  }

  const typed = value.trim().length > 0
  const showPanel = open && (typed || openOnFocus)
  /**
   * A box that cannot be typed in cannot be cleared either, so it keeps the
   * icon it was given rather than offering a cross that does nothing.
   */
  const clearable = typed && !inputProps.disabled && !inputProps.readOnly

  return (
    <div ref={containerRef} className="relative">
      <Input
        {...inputProps}
        ref={inputRef}
        label={label}
        leftIcon={leftIcon}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-autocomplete="list"
        onChange={(e) => {
          onValueChange(e.target.value)
          onOpenChange(true)
        }}
        onClick={() => {
          // Focus alone is not enough: a box that already has it — the one just
          // picked from — would never open its list again.
          if (openOnFocus) onOpenChange(true)
        }}
        onFocus={(e) => {
          if (openOnFocus) onOpenChange(true)
          if (!selected) return
          e.target.select()
          selectingOnFocus.current = true
        }}
        onMouseUp={(e) => {
          // The click that focused the box would drop that selection and put a
          // caret mid-value, which is what makes a full box feel unusable.
          if (!selectingOnFocus.current) return
          e.preventDefault()
          selectingOnFocus.current = false
        }}
        onBlur={() => {
          selectingOnFocus.current = false
        }}
        onKeyDown={onKeyDown}
        error={error}
        rightSlot={
          loading && showPanel ? (
            <span className="flex h-9 w-9 items-center justify-center text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          ) : clearable ? (
            <button
              type="button"
              onClick={clear}
              aria-label={`Clear ${label.replace(' *', '')}`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            rightSlot
          )
        }
      />

      {showPanel && (
        <div
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {listError ? (
            <p className="px-3.5 py-3 text-sm text-red-600">{listError}</p>
          ) : options.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-slate-500">
              {loading ? 'Searching…' : emptyLabel}
            </p>
          ) : (
            <ul className="scrollbar-thin max-h-60 overflow-y-auto py-1">
              {options.map((option, index) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlight}
                    // Down before blur, so the row is still there to be clicked.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => choose(option)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors',
                      index === highlight ? 'bg-primary-50' : 'hover:bg-slate-50',
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 truncate text-sm font-medium text-slate-900',
                        option.monoTitle && 'font-mono font-semibold',
                      )}
                    >
                      {option.title}
                    </span>
                    {option.meta && (
                      <span
                        className={cn(
                          'min-w-0 shrink-0 truncate text-sm text-slate-500',
                          option.monoMeta && 'font-mono',
                        )}
                      >
                        {option.meta}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
