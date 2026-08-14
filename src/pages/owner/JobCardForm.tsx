import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Button, Input, Select, Textarea, useToast } from '@/components/ui'
import { PageHeader } from '@/components/common'
import { customers } from '@/mock/customers'
import { vehicles } from '@/mock/vehicles'

interface JobFormValues {
  customerId: string
  vehicleId: string
  services: string
  labour: string
  notes: string
}

export function JobCardForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<JobFormValues>()

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('Job card created', 'success')
      navigate('/app/job-cards')
    }, 800)
  }

  const customerOptions = customers.map((c) => ({ label: c.name, value: c.id }))
  const vehicleOptions = vehicles.map((v) => ({ label: `${v.name} · ${v.number}`, value: v.id }))

  return (
    <div>
      <button
        onClick={() => navigate('/app/job-cards')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Job Cards
      </button>

      <PageHeader title="New Job Card" />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Customer *"
              placeholder="Select customer"
              options={customerOptions}
              error={errors.customerId?.message}
              {...register('customerId', { required: 'Please select a customer' })}
            />
            <Select
              label="Vehicle *"
              placeholder="Select vehicle"
              options={vehicleOptions}
              error={errors.vehicleId?.message}
              {...register('vehicleId', { required: 'Please select a vehicle' })}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Services *"
                placeholder="Oil Change, Brake Inspection, General Service"
                error={errors.services?.message}
                {...register('services', { required: 'Add at least one service' })}
              />
            </div>
            <Input label="Labour Charge (₹)" type="number" placeholder="2000" {...register('labour')} />
            <div className="md:col-span-2">
              <Textarea label="Notes" placeholder="Any additional notes..." {...register('notes')} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" variant="outline" fullWidth className="lg:w-auto lg:flex-none" onClick={() => navigate('/app/job-cards')}>
            Cancel
          </Button>
          <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={loading}>
            Create Job Card
          </Button>
        </div>
      </form>
    </div>
  )
}
