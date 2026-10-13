import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { ComboboxInput } from './ComboboxInput'
import { useCustomerSearch } from '@/hooks/useCustomerSearch'
import type { CustomerRecord } from '@/types/customer'

type InputAttrs = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSelect'>

interface CustomerSearchInputProps extends InputAttrs {
  label: string
  value: string
  /** Every keystroke, so the field stays a plain text box for a new customer. */
  onValueChange: (value: string) => void
  /** A saved customer was picked from the list. */
  onSelect: (customer: CustomerRecord) => void
  /**
   * Which half of the customer this box holds. The list shows the name and the
   * mobile number either way; this only decides which one leads.
   */
  field: 'name' | 'mobile'
  /** True while the box holds a saved customer rather than typed text. */
  selected?: boolean
  error?: string
  rightSlot?: ReactNode
}

/**
 * A customer box that searches as it is typed: every pause sends what is in the
 * box to `GET /api/auth/jobcard/customer-search` and the matches drop down
 * underneath it. Picking one fills the name and the mobile number together, so
 * either box can be the one the desk starts from.
 */
export function CustomerSearchInput({
  value,
  onValueChange,
  onSelect,
  field,
  ...comboProps
}: CustomerSearchInputProps) {
  const [open, setOpen] = useState(false)
  // Nothing is searched while the list is shut, so picking a customer — which
  // writes their name into the box — does not go looking for them again.
  const { results, loading, error } = useCustomerSearch(value, open)

  const options = results.map((customer) => ({
    id: customer.id,
    title: field === 'mobile' ? customer.mobileNumber : customer.fullName,
    meta: field === 'mobile' ? customer.fullName : customer.mobileNumber,
    monoTitle: field === 'mobile',
    monoMeta: field === 'name',
  }))

  return (
    <ComboboxInput
      {...comboProps}
      value={value}
      onValueChange={onValueChange}
      options={options}
      onPick={(option) => {
        const picked = results.find((customer) => customer.id === option.id)
        if (picked) onSelect(picked)
      }}
      open={open}
      onOpenChange={setOpen}
      loading={loading}
      listError={error}
      emptyLabel="No customers found — type on to add a new one."
    />
  )
}
