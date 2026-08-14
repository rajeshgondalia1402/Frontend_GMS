import { useState } from 'react'
import { Plus, Pencil, Package } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, Badge, Modal, Input, useToast } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { plans } from '@/mock/plans'
import { formatCurrency } from '@/lib/utils'

interface PlanFormValues {
  name: string
  price: string
  duration: string
}

export function AdminPlans() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { register, handleSubmit, reset } = useForm<PlanFormValues>()

  const onSubmit = () => {
    toast('Plan saved', 'success')
    setOpen(false)
    reset()
  }

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage platform pricing"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            <span className="hidden sm:inline">Add Plan</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-slate-500">/ {plan.duration}</span>
                </div>
              </div>
              <Badge tone={plan.active ? 'success' : 'neutral'}>{plan.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">
              <Button size="sm" variant="outline" fullWidth leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setOpen(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant={plan.active ? 'ghost' : 'primary'}
                fullWidth
                onClick={() => toast(plan.active ? `${plan.name} deactivated` : `${plan.name} activated`, 'success')}
              >
                {plan.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Plan Details"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSubmit(onSubmit)}>
              Save Plan
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input label="Plan Name" placeholder="Monthly" leftIcon={<Package className="h-4 w-4" />} {...register('name')} />
          <Input label="Price (₹)" type="number" placeholder="149" {...register('price')} />
          <Input label="Duration" placeholder="1 Month" {...register('duration')} />
        </form>
      </Modal>
    </div>
  )
}
