import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Button, Input, Textarea, useToast } from '@/components/ui'
import { PageHeader } from '@/components/common'
import { customers } from '@/mock/customers'

interface CustomerFormValues {
  name: string
  mobile: string
  email: string
  address: string
}

export function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const existing = id ? customers.find((c) => c.id === id) : undefined
  const isEdit = Boolean(existing)

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormValues>({
    defaultValues: {
      name: existing?.name ?? '',
      mobile: existing?.mobile ?? '',
      email: existing?.email ?? '',
      address: existing?.address ?? '',
    },
  })

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast(isEdit ? 'Customer updated' : 'Customer added', 'success')
      navigate('/app/customers')
    }, 800)
  }

  return (
    <div>
      <button
        onClick={() => navigate('/app/customers')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      <PageHeader title={isEdit ? 'Edit Customer' : 'Add Customer'} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Customer Name *"
                placeholder="Rajesh Patel"
                error={errors.name?.message}
                {...register('name', { required: 'Customer name is required' })}
              />
            </div>
            <Input
              label="Mobile Number"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              error={errors.mobile?.message}
              {...register('mobile', {
                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit number' },
              })}
            />
            <Input label="Email" type="email" placeholder="name@example.com" {...register('email')} />
            <div className="md:col-span-2">
              <Textarea label="Address" placeholder="Street, area, city" {...register('address')} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="lg:w-auto lg:flex-none"
            onClick={() => navigate('/app/customers')}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={loading}>
            Save Customer
          </Button>
        </div>
      </form>
    </div>
  )
}
