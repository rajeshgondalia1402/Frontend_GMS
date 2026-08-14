import { useState } from 'react'
import { Plus, Phone, UsersRound, Eye } from 'lucide-react'
import { PageHeader, FilterButton } from '@/components/common'
import { Button, Modal, Input, Select, StatusBadge, EmptyState, useToast } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { staff as allStaff } from '@/mock/staff'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Mechanics', value: 'Mechanic' },
  { label: 'Service Advisors', value: 'Service Advisor' },
  { label: 'Other', value: 'Other' },
]

interface StaffFormValues {
  name: string
  role: string
  category: string
  mobile: string
  salary: string
}

export function Staff() {
  const [category, setCategory] = useState('all')
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormValues>()

  const filtered = allStaff.filter((s) => category === 'all' || s.category === category)

  const onSubmit = () => {
    toast('Staff member added', 'success')
    setOpen(false)
    reset()
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage your team"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            <span className="hidden sm:inline">Add Staff</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4">
        <FilterButton options={filters} value={category} onChange={setCategory} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UsersRound} title="No staff found" description="Add your first team member." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-700">
                    {s.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-500">{s.role}</p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone className="h-3.5 w-3.5" /> {s.mobile}
                </p>
                <Button size="sm" variant="ghost" leftIcon={<Eye className="h-4 w-4" />} onClick={() => toast('Opening profile...', 'info')}>
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Staff"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSubmit(onSubmit)}>
              Save Staff
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Name *"
            placeholder="Amit Sharma"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Select
            label="Category"
            placeholder="Select category"
            options={[
              { label: 'Mechanic', value: 'Mechanic' },
              { label: 'Service Advisor', value: 'Service Advisor' },
              { label: 'Other', value: 'Other' },
            ]}
            {...register('category')}
          />
          <Input label="Role" placeholder="Senior Mechanic" {...register('role')} />
          <Input label="Mobile Number" type="tel" inputMode="numeric" placeholder="9876543210" {...register('mobile')} />
          <Input label="Monthly Salary (₹)" type="number" placeholder="18000" {...register('salary')} />
        </form>
      </Modal>
    </div>
  )
}
