import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle, CalendarDays, CalendarRange, CreditCard, IndianRupee, MessageSquare, User } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Select, Textarea, WhatsappIcon, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useAllStaff } from '@/hooks/useAllStaff'
import { salaryService } from '@/services/salaryService'
import { ApiError } from '@/services/httpClient'
import {
  SALARY_MODE_OPTIONS,
  SALARY_REMARKS_MAX_LENGTH,
  currentMonthValue,
  salarySlipLink,
  todayValue,
} from '@/lib/salary'
import { toWhatsappNumber } from '@/lib/whatsapp'
import type { SalaryPaymentMode, SalaryPayload, SalaryRecord } from '@/types/salary'

interface SalaryFormValues {
  staffId: string
  amount: string
  paymentDate: string
  salaryMonth: string
  paymentMode: SalaryPaymentMode | ''
  remarks: string
}

const FIELDS: (keyof SalaryFormValues)[] = ['staffId', 'amount', 'paymentDate', 'salaryMonth', 'paymentMode', 'remarks']

function emptyForm(): SalaryFormValues {
  return {
    staffId: '',
    amount: '',
    paymentDate: todayValue(),
    salaryMonth: currentMonthValue(),
    paymentMode: 'CASH',
    remarks: '',
  }
}

function formFrom(record: SalaryRecord): SalaryFormValues {
  return {
    staffId: record.staffId,
    amount: String(record.amount),
    paymentDate: record.paymentDate,
    salaryMonth: record.salaryMonth,
    paymentMode: record.paymentMode,
    remarks: record.remarks ?? '',
  }
}

function toPayload(values: SalaryFormValues): SalaryPayload {
  return {
    staffId: values.staffId,
    amount: Number(values.amount),
    paymentDate: values.paymentDate,
    salaryMonth: values.salaryMonth,
    paymentMode: values.paymentMode as SalaryPaymentMode,
    remarks: values.remarks.trim() || null,
  }
}

interface SalaryFormModalProps {
  open: boolean
  onClose: () => void
  /** The record being changed; left out, the dialog adds a new one. */
  salary?: SalaryRecord | null
  onSaved: (salary: SalaryRecord) => void
}

/** One dialog for both `POST` and `PUT /api/auth/staff-salary`. */
export function SalaryFormModal({ open, onClose, salary, onSaved }: SalaryFormModalProps) {
  const { toast } = useToast()
  // The slip goes out over the garage's name.
  const { user } = useAuth()
  const editing = Boolean(salary)
  const { staff, loading: staffLoading, error: staffError } = useAllStaff()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError: setFieldError,
    formState: { errors },
  } = useForm<SalaryFormValues>({ mode: 'onTouched', defaultValues: emptyForm() })

  useEffect(() => {
    if (!open) return
    reset(salary ? formFrom(salary) : emptyForm())
    setError(null)
    setSaving(false)
  }, [open, salary, reset])

  // Every staff member on the books, plus — when editing — the one on the
  // record even if they have since been deleted, so the select never shows blank.
  const staffOptions = useMemo(() => {
    const options = staff.map((s) => ({
      value: s.id,
      label: `${s.name}${s.status === 'INACTIVE' ? ' (inactive)' : ''} — ${s.mobileNumber}`,
    }))
    if (salary && !staff.some((s) => s.id === salary.staffId)) {
      options.unshift({ value: salary.staffId, label: `${salary.staff.name} (removed)` })
    }
    return options
  }, [staff, salary])

  // Picking someone fills in their monthly salary; the amount can still be
  // changed by hand afterwards (an advance, a part payment, a bonus).
  const staffField = register('staffId', { required: 'Select a staff member.' })
  const onStaffChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    void staffField.onChange(event)
    const picked = staff.find((s) => s.id === event.target.value)
    setValue('amount', picked?.monthlySalary ? String(picked.monthlySalary) : '', {
      shouldValidate: Boolean(picked?.monthlySalary),
    })
  }

  const paymentDate = watch('paymentDate')
  const staffId = watch('staffId')

  // The slip goes to the staff member picked, so the offer only shows when
  // their mobile number is one WhatsApp can open a chat with.
  const pickedStaff = staff.find((s) => s.id === staffId)
  const slipNumber = toWhatsappNumber(
    pickedStaff?.mobileNumber ?? (salary && salary.staffId === staffId ? salary.staff.mobileNumber : null),
  )
  const [sendSlip, setSendSlip] = useState(true)
  useEffect(() => {
    if (open) setSendSlip(!salary)
  }, [open, salary])

  // A tab opened after the save comes back is a blocked pop-up, so a blank
  // one is claimed on the click itself and pointed at WhatsApp afterwards.
  const slipTab = useRef<Window | null>(null)
  const submitClick = () => {
    slipTab.current = slipNumber && sendSlip ? window.open('about:blank', '_blank') : null
    void handleSubmit(onSubmit, () => {
      slipTab.current?.close()
      slipTab.current = null
    })()
  }

  const close = () => {
    if (saving) return
    onClose()
  }

  const onSubmit = async (values: SalaryFormValues) => {
    setSaving(true)
    setError(null)
    try {
      const saved = salary
        ? await salaryService.updateSalary(salary.id, toPayload(values))
        : await salaryService.createSalary(toPayload(values))
      onSaved(saved)
      toast(salary ? 'Salary record updated' : 'Salary record added', 'success')
      const tab = slipTab.current
      slipTab.current = null
      if (tab) {
        const link = salarySlipLink(saved, user)
        if (link) tab.location.href = link
        else tab.close()
      }
      onClose()
    } catch (err) {
      slipTab.current?.close()
      slipTab.current = null
      setSaving(false)
      if (!(err instanceof ApiError)) {
        setError('Could not save the salary record. Please try again.')
        return
      }
      setError(err.message)
      for (const { field, message } of err.fieldErrors) {
        if ((FIELDS as string[]).includes(field)) {
          setFieldError(field as keyof SalaryFormValues, { type: 'server', message })
        }
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? 'Edit Salary' : 'Add Salary'}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button
            fullWidth
            loading={saving}
            leftIcon={slipNumber && sendSlip ? <WhatsappIcon className="h-4 w-4" /> : undefined}
            onClick={submitClick}
          >
            {editing ? 'Update Salary' : 'Save Salary'}
          </Button>
        </div>
      }
    >
      {(error || staffError) && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error || staffError}</p>
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          submitClick()
        }}
        noValidate
      >
        <Select
          label="Staff *"
          placeholder={staffLoading ? 'Loading staff...' : staffOptions.length ? 'Select staff' : 'No staff added yet'}
          options={staffOptions}
          disabled={staffLoading}
          leftIcon={<User className="h-4 w-4" />}
          error={errors.staffId?.message}
          {...staffField}
          onChange={onStaffChange}
        />

        <Input
          label="Amount *"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="15000"
          leftIcon={<IndianRupee className="h-4 w-4" />}
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required.',
            validate: (value) => {
              const amount = Number(value)
              if (!Number.isFinite(amount)) return 'Amount must be a number.'
              if (amount <= 0) return 'Amount must be greater than 0.'
              if (amount > 99999999.99) return 'Amount is too large.'
              if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return 'Amount may have at most 2 decimal places.'
              return true
            },
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Payment Date *"
            type="date"
            leftIcon={<CalendarDays className="h-4 w-4" />}
            error={errors.paymentDate?.message}
            {...register('paymentDate', { required: 'Payment date is required.' })}
          />
          <Input
            label="Salary Month *"
            type="month"
            hint={paymentDate ? 'The month this payment is for' : undefined}
            leftIcon={<CalendarRange className="h-4 w-4" />}
            error={errors.salaryMonth?.message}
            {...register('salaryMonth', {
              required: 'Salary month is required.',
              pattern: { value: /^\d{4}-(0[1-9]|1[0-2])$/, message: 'Pick a valid month.' },
            })}
          />
        </div>

        <Select
          label="Payment Mode *"
          options={SALARY_MODE_OPTIONS}
          leftIcon={<CreditCard className="h-4 w-4" />}
          error={errors.paymentMode?.message}
          {...register('paymentMode', { required: 'Payment mode is required.' })}
        />

        <Textarea
          label="Remarks"
          rows={2}
          placeholder="e.g. October salary, advance, bonus"
          maxLength={SALARY_REMARKS_MAX_LENGTH}
          leftIcon={<MessageSquare className="h-4 w-4" />}
          error={errors.remarks?.message}
          {...register('remarks', {
            maxLength: { value: SALARY_REMARKS_MAX_LENGTH, message: `Remarks must be at most ${SALARY_REMARKS_MAX_LENGTH} characters.` },
          })}
        />

        {slipNumber && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
            <Checkbox
              id="sendSalarySlip"
              disabled={saving}
              checked={sendSlip}
              onChange={(e) => setSendSlip(e.target.checked)}
              label={
                <span className="flex items-center gap-1.5 text-emerald-900">
                  Send salary slip on
                  <WhatsappIcon className="h-4 w-4 text-emerald-600" />
                </span>
              }
              hint="Opens WhatsApp with the slip ready — you still press send."
            />
          </div>
        )}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}
