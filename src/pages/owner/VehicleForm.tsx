import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Button, Input, Select, useToast } from '@/components/ui'
import { PageHeader } from '@/components/common'
import { vehicles } from '@/mock/vehicles'
import { customers } from '@/mock/customers'

interface VehicleFormValues {
  number: string
  type: string
  brand: string
  model: string
  year: string
  customerId: string
  fuelType: string
}

export function VehicleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const existing = id ? vehicles.find((v) => v.id === id) : undefined
  const isEdit = Boolean(existing)

  const { register, handleSubmit, formState: { errors } } = useForm<VehicleFormValues>({
    defaultValues: {
      number: existing?.number ?? '',
      type: existing?.type ?? '',
      brand: existing?.brand ?? '',
      model: existing?.model ?? '',
      year: existing?.year ?? '',
      customerId: existing?.ownerId ?? '',
      fuelType: existing?.fuelType ?? '',
    },
  })

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast(isEdit ? 'Vehicle updated' : 'Vehicle added', 'success')
      navigate('/app/vehicles')
    }, 800)
  }

  const typeOptions = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Truck', 'Two Wheeler'].map((t) => ({ label: t, value: t }))
  const fuelOptions = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((f) => ({ label: f, value: f }))
  const customerOptions = customers.map((c) => ({ label: c.name, value: c.id }))

  return (
    <div>
      <button
        onClick={() => navigate('/app/vehicles')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Vehicles
      </button>

      <PageHeader title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Vehicle Number *"
                placeholder="GJ 05 AB 1234"
                className="uppercase"
                error={errors.number?.message}
                {...register('number', { required: 'Vehicle number is required' })}
              />
            </div>
            <Select label="Vehicle Type" placeholder="Select type" options={typeOptions} {...register('type')} />
            <Input label="Brand" placeholder="Maruti Suzuki" {...register('brand')} />
            <Input label="Model" placeholder="Swift Dzire" {...register('model')} />
            <Input label="Year" type="number" placeholder="2021" {...register('year')} />
            <Select label="Customer" placeholder="Select owner" options={customerOptions} {...register('customerId')} />
            <Select label="Fuel Type" placeholder="Select fuel" options={fuelOptions} {...register('fuelType')} />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" variant="outline" fullWidth className="lg:w-auto lg:flex-none" onClick={() => navigate('/app/vehicles')}>
            Cancel
          </Button>
          <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={loading}>
            Save Vehicle
          </Button>
        </div>
      </form>
    </div>
  )
}
