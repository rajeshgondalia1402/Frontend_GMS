import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { FlowSteps, PageHeader } from '@/components/common'
import { CustomerFields } from '@/components/customers'
import { customerService } from '@/services/customerService'
import { ApiError } from '@/services/httpClient'
import { saveActiveCustomer } from '@/lib/activeCustomer'
import {
  EMPTY_CUSTOMER_FORM,
  NEW_CUSTOMER_STEPS,
  applyCustomerApiError,
  toCreateCustomerPayload,
} from '@/lib/customerForm'
import type { CustomerFormValues } from '@/lib/customerForm'

/**
 * Step 1 of adding a walk-in: who the customer is. Saving goes straight on to
 * their vehicle (step 2) — or, with "Save only", back to the list. Editing a
 * customer happens in the dialog on their details page.
 */
export function CustomerForm() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [saving, setSaving] = useState<'vehicle' | 'only' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CustomerFormValues>({
    mode: 'onTouched',
    // Most customers use WhatsApp on their mobile number, so that is the default.
    defaultValues: { ...EMPTY_CUSTOMER_FORM, sameAsMobile: true },
  })
  const { handleSubmit, setError: setFieldError, setFocus } = form

  const save = (next: 'vehicle' | 'only') =>
    handleSubmit(async (values: CustomerFormValues) => {
      setSaving(next)
      setError(null)

      try {
        const customer = await customerService.createCustomer(toCreateCustomerPayload(values))

        if (next === 'only') {
          toast(`${customer.fullName} added`, 'success')
          navigate('/app/customers')
          return
        }

        // Straight on to the vehicle step, with the created customer in hand:
        // its `id` is what `POST /auth/vehicle` needs as `customerId`.
        saveActiveCustomer(customer)
        toast(`${customer.fullName} saved — now add the vehicle`, 'success')
        navigate(`/app/customers/${customer.id}?flow=new`, { state: { customer } })
      } catch (err) {
        setSaving(null)

        if (!(err instanceof ApiError)) {
          setError('Could not save the customer. Please try again.')
          return
        }

        setError(err.message)
        applyCustomerApiError(err, setFieldError, setFocus)
      }
    })

  return (
    <div>
      <button
        onClick={() => navigate('/app/customers')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      <PageHeader
        title="Add New Customer"
        subtitle="Enter the customer's details, then add the vehicle they brought in."
      />

      <FlowSteps steps={NEW_CUSTOMER_STEPS} current={0} />

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={save('vehicle')} noValidate>
        <CustomerFields form={form} sectioned />

        {/* Stays in reach of the thumb on a phone, above the bottom bar. */}
        <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 mt-4 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur lg:bottom-4 sm:p-4">
          <div className="flex items-center gap-2 sm:justify-between sm:gap-3">
            {/* Phones already have "Back to Customers" at the top. */}
            <Button
              type="button"
              variant="ghost"
              className="hidden sm:inline-flex"
              disabled={saving !== null}
              onClick={() => navigate('/app/customers')}
            >
              Cancel
            </Button>
            <div className="grid flex-1 grid-cols-[auto_1fr] gap-2 sm:flex sm:flex-none sm:gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving === 'vehicle'}
                loading={saving === 'only'}
                onClick={() => void save('only')()}
              >
                <span className="sm:hidden">Save only</span>
                <span className="hidden sm:inline">Save, add vehicle later</span>
              </Button>
              <Button
                type="submit"
                disabled={saving === 'only'}
                loading={saving === 'vehicle'}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next: Add Vehicle
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
