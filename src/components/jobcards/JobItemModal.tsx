import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Hash, IndianRupee, Wrench } from 'lucide-react'
import { Button, Input, Modal } from '@/components/ui'
import type { JobLineItem } from '@/types'

export type JobItemDraft = Omit<JobLineItem, 'id'>

interface JobItemFormValues {
  description: string
  qty: string
  rate: string
}

interface JobItemModalProps {
  open: boolean
  /** The row being edited; `null` adds a new one. */
  item: JobLineItem | null
  onSave: (draft: JobItemDraft) => void
  onClose: () => void
}

const BLANK: JobItemFormValues = { description: '', qty: '1', rate: '' }

export function JobItemModal({ open, item, onSave, onClose }: JobItemModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobItemFormValues>({ mode: 'onTouched', defaultValues: BLANK })

  // Load the row being edited — or clear the form — each time it opens.
  useEffect(() => {
    if (!open) return
    reset(
      item
        ? { description: item.description, qty: String(item.qty), rate: String(item.rate) }
        : BLANK,
    )
  }, [open, item, reset])

  const onSubmit = (values: JobItemFormValues) => {
    onSave({
      description: values.description.trim(),
      qty: Number(values.qty),
      rate: Number(values.rate || 0),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Edit Service / Item' : 'Add Service / Item'}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth onClick={handleSubmit(onSubmit)}>
            {item ? 'Update Item' : 'Add Item'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Description *"
          placeholder="Engine Oil Change"
          maxLength={120}
          leftIcon={<Wrench className="h-4 w-4" />}
          error={errors.description?.message}
          {...register('description', {
            required: 'Description is required',
            validate: (v) => v.trim().length > 0 || 'Description is required',
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Qty *"
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            placeholder="1"
            leftIcon={<Hash className="h-4 w-4" />}
            error={errors.qty?.message}
            {...register('qty', {
              required: 'Qty is required',
              validate: (v) => (Number(v) >= 1 && Number.isInteger(Number(v))) || 'Qty must be 1 or more',
            })}
          />
          <Input
            label="Rate *"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="2000"
            leftIcon={<IndianRupee className="h-4 w-4" />}
            error={errors.rate?.message}
            {...register('rate', {
              required: 'Rate is required',
              validate: (v) => Number(v) >= 0 || 'Rate cannot be negative',
            })}
          />
        </div>

        {/* Lets Enter submit the form without a visible duplicate button */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}
