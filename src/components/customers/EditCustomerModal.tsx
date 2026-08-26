import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { Button, Modal, useToast } from '@/components/ui'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import {
  EMPTY_CUSTOMER_FORM,
  applyCustomerApiError,
  applyCustomerUpdate,
  customerToFormValues,
  toUpdateCustomerPayload,
} from '@/lib/customerForm'
import type { CustomerFormValues } from '@/lib/customerForm'
import type { CustomerRecord } from '@/types/customer'
import { CustomerFields } from './CustomerFields'

interface EditCustomerModalProps {
  open: boolean
  customer: CustomerRecord
  onClose: () => void
  /** Hands the saved row back so the page keeps showing current details. */
  onUpdated: (customer: CustomerRecord) => void
}

export function EditCustomerModal({ open, customer, onClose, onUpdated }: EditCustomerModalProps) {
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CustomerFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_CUSTOMER_FORM,
  })
  const { handleSubmit, reset, setError: setFieldError, setFocus } = form

  // Reseed every time the dialog opens, so a cancelled edit is not carried over.
  useEffect(() => {
    if (!open) return
    reset(customerToFormValues(customer))
    setError(null)
    setSaving(false)
  }, [open, customer, reset])

  const close = () => {
    if (saving) return
    onClose()
  }

  const onSubmit = async (values: CustomerFormValues) => {
    const patch = toUpdateCustomerPayload(values, customer)

    // An empty body is a 400 — nothing was touched, so there is nothing to send.
    if (Object.keys(patch).length === 0) {
      toast('No changes to save', 'info')
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await customerService.updateCustomer(customer.id, patch)
      onUpdated(applyCustomerUpdate(customer, patch, updated))
      toast('Customer updated', 'success')
      onClose()
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError('Could not update the customer. Please try again.')
        return
      }

      setError(err.message)
      applyCustomerApiError(err, setFieldError, setFocus)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Edit Customer"
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={handleSubmit(onSubmit)}>
            Save Changes
          </Button>
        </div>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CustomerFields form={form} columns={1} />

        {/* Lets Enter submit the form without a visible duplicate button */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}
