import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Wrench, Camera } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, Input, Textarea, Card, useToast } from '@/components/ui'

interface ProfileValues {
  garageName: string
  ownerName: string
  mobile: string
  email: string
  address: string
  gst: string
  workingDays: string
  workingHours: string
}

export function GarageProfile() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<ProfileValues>({
    defaultValues: {
      garageName: 'ABC Auto Garage',
      ownerName: 'Rajesh Patel',
      mobile: '9876543210',
      email: 'garage@example.com',
      address: 'Satellite, Ahmedabad, Gujarat',
      gst: '24ABCDE1234F1Z5',
      workingDays: 'Mon - Sat',
      workingHours: '9:00 AM - 8:00 PM',
    },
  })

  const onSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('Profile saved', 'success')
    }, 800)
  }

  return (
    <div>
      <PageHeader title="Garage Profile" subtitle="Your garage details" />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        {/* Logo */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Wrench className="h-7 w-7" />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-700"
                aria-label="Change logo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Garage Logo</p>
              <p className="text-sm text-slate-500">PNG or JPG, up to 2MB</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input label="Garage Name" {...register('garageName')} />
            </div>
            <Input label="Owner Name" {...register('ownerName')} />
            <Input label="Mobile Number" type="tel" inputMode="numeric" {...register('mobile')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="GST Number" {...register('gst')} />
            <div className="md:col-span-2">
              <Textarea label="Address" {...register('address')} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Working Hours</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Working Days" {...register('workingDays')} />
            <Input label="Hours" {...register('workingHours')} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
