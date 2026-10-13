import { useState } from 'react'
import type { ReactNode } from 'react'
import { ComboboxInput } from '@/components/jobcards/ComboboxInput'
import type { ComboOption } from '@/components/jobcards/ComboboxInput'
import { filterSuggestions } from '@/lib/carSelling'

interface SuggestionComboboxProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  /** The pick list. Anything typed that is not on it is still kept. */
  suggestions: string[]
  placeholder?: string
  maxLength?: number
  leftIcon?: ReactNode
  error?: string
}

/**
 * A searchable dropdown over a fixed pick list that still takes free text:
 * the list opens on focus, narrows as you type, and a value not on it is
 * saved as typed.
 */
export function SuggestionCombobox({
  label,
  name,
  value,
  onChange,
  suggestions,
  placeholder,
  maxLength,
  leftIcon,
  error,
}: SuggestionComboboxProps) {
  const [open, setOpen] = useState(false)

  const listed = suggestions.some((s) => s.toLowerCase() === value.trim().toLowerCase())

  // A value already picked from the list offers the whole list again, so
  // switching to another entry is one tap.
  const options: ComboOption[] = (listed ? suggestions : filterSuggestions(suggestions, value)).map(
    (entry) => ({ id: entry, title: entry }),
  )

  return (
    <ComboboxInput
      label={label}
      name={name}
      placeholder={placeholder}
      maxLength={maxLength}
      leftIcon={leftIcon}
      value={value}
      onValueChange={onChange}
      options={options}
      onPick={(option) => onChange(option.title)}
      open={open}
      onOpenChange={setOpen}
      openOnFocus
      // A picked entry selects in full on focus, so it is typed straight over.
      selected={listed}
      emptyLabel={`Not in the list — "${value.trim()}" will be saved as typed`}
      error={error}
    />
  )
}
