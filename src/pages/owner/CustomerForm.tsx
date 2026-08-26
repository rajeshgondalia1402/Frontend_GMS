import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { PageHeader } from '@/components/common'
import { CustomerFields } from '@/components/customers'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import { saveActiveCustomer } from '@/lib/activeCustomer'
import {
  EMPTY_CUSTOMER_FORM,
  applyCustomerApiError,
  toCreateCustomerPayload,
} from '@/lib/customerForm'
import type { CustomerFormValues } from '@/lib/customerForm'

/**
 * Adds a customer. Editing one happens in the dialog on their details page,
 * where the saved record is on hand to diff against.
 */
export function CustomerForm() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CustomerFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_CUSTOMER_FORM,
  })
  const { handleSubmit, setError: setFieldError, setFocus } = form

  const onSubmit = async (values: CustomerFormValues) => {
    setSaving(true)
    setError(null)

    try {
      const customer = await customerService.createCustomer(toCreateCustomerPayload(values))

      // Straight on to the vehicle step, with the created customer in hand:
      // its `id` is what `POST /auth/vehicle` needs as `customerId`.
      saveActiveCustomer(customer)
      toast(`${customer.fullName} added`, 'success')
      navigate(`/app/customers/${customer.id}`, { state: { customer } })
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError('Could not save the customer. Please try again.')
        return
      }

      setError(err.message)
      applyCustomerApiError(err, setFieldError, setFocus)
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/app/customers')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      <PageHeader title="Add Customer" />

      {error && (
        <div
          role="alert"
          className="mb-4 flex max-w-2xl items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <CustomerFields form={form} />
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="lg:w-auto lg:flex-none"
            disabled={saving}
            onClick={() => navigate('/app/customers')}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={saving}>
            Save &amp; Add Vehicle
          </Button>
        </div>
      </form>
    </div>
  )
}
