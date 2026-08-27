import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ChangeEvent } from 'react'
import { AlertCircle, IndianRupee, Phone } from 'lucide-react'
import { Button, Input, Modal, Select, useToast } from '@/components/ui'
import { staffService } from '@/services/staffService'
import { ApiError } from '@/services/httpClient'
import { STAFF_CATEGORY_OPTIONS } from '@/lib/staff'
import { EMPTY_STAFF_FORM, applyStaffApiError, toCreateStaffPayload } from '@/lib/staffForm'
import type { StaffFormValues } from '@/lib/staffForm'
import {
  MOBILE_LENGTH,
  STAFF_NAME_MAX_LENGTH,
  STAFF_ROLE_MAX_LENGTH,
  mobileNumberRules,
  monthlySalaryRules,
  normalizeMobileInput,
  optionalStaffRoleRules,
  staffCategoryRules,
  staffNameRules,
} from '@/lib/validation'
import type { StaffRecord } from '@/types/staff'

interface AddStaffModalProps {
  open: boolean
  onClose: () => void
  /** Reports the saved row; the list is reloaded so it appears in order. */
  onCreated: (staff: StaffRecord) => void
}

/**
 * `POST /api/auth/staff`. The status is not part of the form — a staff member
 * who has just been added is always working at the garage, so the API sets
 * `ACTIVE` itself.
 */
export function AddStaffModal({ open, onClose, onCreated }: AddStaffModalProps) {
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    setFocus,
    formState: { errors },
  } = useForm<StaffFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_STAFF_FORM,
  })

  // Start clean every time the dialog opens, so a cancelled entry is not
  // carried over into the next one.
  useEffect(() => {
    if (!open) return
    reset(EMPTY_STAFF_FORM)
    setError(null)
    setSaving(false)
  }, [open, reset])

  const close = () => {
    if (saving) return
    onClose()
  }

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeMobileInput(e.target.value)
    void mobileField.onChange(e)
  }

  const onSubmit = async (values: StaffFormValues) => {
    setSaving(true)
    setError(null)

    try {
      const created = await staffService.createStaff(toCreateStaffPayload(values))
      onCreated(created)
      toast('Staff member added', 'success')
      onClose()
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError('Could not add the staff member. Please try again.')
        return
      }

      setError(err.message)
      applyStaffApiError(err, setFieldError, setFocus)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Staff"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={handleSubmit(onSubmit)}>
            Save Staff
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

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Name *"
          placeholder="Rahul Patel"
          autoComplete="name"
          maxLength={STAFF_NAME_MAX_LENGTH}
          error={errors.name?.message}
          {...register('name', staffNameRules)}
        />

        <Select
          label="Category *"
          placeholder="Select category"
          options={STAFF_CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...register('category', staffCategoryRules)}
        />

        <Input
          label="Role"
          placeholder="Senior Mechanic"
          maxLength={STAFF_ROLE_MAX_LENGTH}
          hint="Optional — the job title printed on the card"
          error={errors.role?.message}
          {...register('role', optionalStaffRoleRules)}
        />

        <Input
          label="Mobile Number *"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9876543210"
          maxLength={MOBILE_LENGTH}
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.mobileNumber?.message}
          {...mobileField}
          onChange={onMobileChange}
        />

        <Input
          label="Monthly Salary"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="18000"
          leftIcon={<IndianRupee className="h-4 w-4" />}
          hint="Optional — leave blank until the pay is agreed"
          error={errors.monthlySalary?.message}
          {...register('monthlySalary', monthlySalaryRules)}
        />

        {/* Lets Enter submit the form without a visible duplicate button */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}
