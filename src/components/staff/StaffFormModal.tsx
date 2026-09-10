import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ChangeEvent } from 'react'
import { AlertCircle, BadgeCheck, Briefcase, IndianRupee, Phone, ToggleLeft, User } from 'lucide-react'
import { Button, Input, Modal, Select, useToast } from '@/components/ui'
import { staffService } from '@/services/staffService'
import { ApiError } from '@/services/httpClient'
import { STAFF_CATEGORY_OPTIONS, STAFF_STATUS_OPTIONS } from '@/lib/staff'
import {
  EMPTY_STAFF_FORM,
  applyStaffApiError,
  staffFormValues,
  toCreateStaffPayload,
  toUpdateStaffPayload,
} from '@/lib/staffForm'
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
  staffStatusRules,
} from '@/lib/validation'
import type { StaffRecord } from '@/types/staff'

interface StaffFormModalProps {
  open: boolean
  onClose: () => void
  /**
   * The row being changed. Left out, the dialog adds someone instead — which
   * is the only difference between the two, bar the status field.
   */
  staff?: StaffRecord | null
  /** Reports the saved row; the list is reloaded so it appears in order. */
  onSaved: (staff: StaffRecord) => void
}

/**
 * One dialog for both `POST /api/auth/staff` and `PUT /api/auth/staff/:id`.
 *
 * The status is only asked for while editing: someone who has just been added
 * is always working at the garage, so the API sets `ACTIVE` itself and drops a
 * `status` sent on create. Switching someone to `INACTIVE` here does not hide
 * them — they stay in the list, badged.
 */
export function StaffFormModal({ open, onClose, staff, onSaved }: StaffFormModalProps) {
  const { toast } = useToast()

  const editing = Boolean(staff)

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

  // Start from the row being edited, or clean when adding — so a cancelled
  // entry is not carried over into the next time the dialog opens.
  useEffect(() => {
    if (!open) return
    reset(staff ? staffFormValues(staff) : EMPTY_STAFF_FORM)
    setError(null)
    setSaving(false)
  }, [open, staff, reset])

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
      const saved = staff
        ? await staffService.updateStaff(staff.id, toUpdateStaffPayload(values))
        : await staffService.createStaff(toCreateStaffPayload(values))

      onSaved(saved)
      toast(staff ? 'Staff member updated' : 'Staff member added', 'success')
      onClose()
    } catch (err) {
      setSaving(false)

      if (!(err instanceof ApiError)) {
        setError(
          staff
            ? 'Could not update the staff member. Please try again.'
            : 'Could not add the staff member. Please try again.',
        )
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
      title={editing ? 'Edit Staff' : 'Add Staff'}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Update Staff' : 'Save Staff'}
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
          leftIcon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name', staffNameRules)}
        />

        <Select
          label="Category *"
          placeholder="Select category"
          options={STAFF_CATEGORY_OPTIONS}
          leftIcon={<Briefcase className="h-4 w-4" />}
          error={errors.category?.message}
          {...register('category', staffCategoryRules)}
        />

        <Input
          label="Role"
          placeholder="Senior Mechanic"
          maxLength={STAFF_ROLE_MAX_LENGTH}
          hint="Optional — the job title printed on the card"
          leftIcon={<BadgeCheck className="h-4 w-4" />}
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

        {/* Only on the way in does the API decide the status for us. */}
        {editing && (
          <div>
            <Select
              label="Status *"
              options={STAFF_STATUS_OPTIONS}
              leftIcon={<ToggleLeft className="h-4 w-4" />}
              error={errors.status?.message}
              {...register('status', staffStatusRules)}
            />
            {!errors.status && (
              <p className="mt-1.5 text-xs text-slate-500">
                Inactive staff stay on the list, marked as no longer working.
              </p>
            )}
          </div>
        )}

        {/* Lets Enter submit the form without a visible duplicate button */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}
