import { useEffect, useState } from 'react'
import { AlertCircle, IndianRupee } from 'lucide-react'
import { Button, Input, Modal, useToast } from '@/components/ui'
import { carSoldService } from '@/services/carSoldService'
import { ApiError } from '@/services/httpClient'
import { amountLabel, carSoldDateLabel } from '@/lib/carSold'
import type { CarSoldPayment, SoldCarRecord } from '@/types/carSold'

interface EditPaymentModalProps {
  open: boolean
  onClose: () => void
  /** The sold car the payment belongs to, or `null` while closed. */
  car: SoldCarRecord | null
  /** The receipt being corrected, or `null` while closed. */
  payment: CarSoldPayment | null
  /** Called once the amount is saved, so the list can read itself again. */
  onSaved: () => void
}

/** Blank fails; otherwise a positive amount no larger than `max`. */
function validateAmount(typed: string, max: number): string | null {
  const amount = typed.trim()
  if (!amount) return 'Enter the amount received'
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    return 'Enter a positive amount with at most 2 decimal places'
  }
  if (Number(amount) <= 0) return 'Payment must be more than 0'
  if (Number(amount) > max) {
    return `Payment cannot be more than ${amountLabel(max)} — the rest of the price is already paid`
  }
  return null
}

/**
 * Corrects the amount on one receipt of a sale, through
 * `POST /api/auth/car-selling/sold-customer/:id/payment/:paymentId`.
 *
 * The most a receipt can be is what it holds now plus what is still pending —
 * the other payments and the price stay as they are. That is checked here
 * before sending, and again by the API against the live payments, which is the
 * check that counts; a 400 from it is shown as it comes back.
 */
export function EditPaymentModal({ open, onClose, car, payment, onSaved }: EditPaymentModalProps) {
  const { toast } = useToast()
  const sale = car?.soldCustomerDetail ?? null

  const [amount, setAmount] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Each receipt opens on the figure it holds now.
  useEffect(() => {
    if (!open || !payment) return
    setAmount(String(payment.paymentAmount))
    setTouched(false)
    setError(null)
  }, [open, payment])

  if (!car || !sale || !payment) return null

  // Rounded to paise, so 0.1 + 0.2 style float noise never blocks a valid amount.
  const max = Math.round((payment.paymentAmount + sale.remainingAmount) * 100) / 100
  const invalid = validateAmount(amount, max)
  const unchanged = Number(amount.trim()) === payment.paymentAmount

  const save = async () => {
    setTouched(true)
    if (invalid) return
    // Nothing to send when the figure is the one already stored.
    if (unchanged) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { carSoldCustomer } = await carSoldService.updateCarSoldPayment(sale.id, payment.id, {
        paymentAmount: Number(amount.trim()),
      })

      toast(
        carSoldCustomer.paymentStatus === 'PAID'
          ? 'Payment updated — this car is now fully paid'
          : `Payment updated — ${amountLabel(carSoldCustomer.remainingAmount)} pending`,
        'success',
      )
      onSaved()
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not update the payment. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="sm"
      title="Edit Payment"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={() => void save()}>
            Save Payment
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

      <p className="text-sm text-slate-600">
        Payment from <span className="font-semibold text-slate-900">{sale.purchaseOwnerName}</span>{' '}
        on <span className="font-semibold text-slate-900">{car.carNumber ?? 'this car'}</span>
        {payment.createdDate ? `, received ${carSoldDateLabel(payment.createdDate)}` : ''}.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center">
        <div>
          <p className="text-xs text-slate-500">Sale Price</p>
          <p className="text-sm font-semibold text-slate-900">
            {amountLabel(sale.finalSellingPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">This Payment</p>
          <p className="text-sm font-semibold text-emerald-600">
            {amountLabel(payment.paymentAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-sm font-semibold text-amber-600">
            {amountLabel(sale.remainingAmount)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Input
          label="Correct Amount *"
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step="0.01"
          autoFocus
          leftIcon={<IndianRupee className="h-4 w-4" />}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => setTouched(true)}
          // Enter saves rather than doing nothing in a dialog.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void save()
            }
          }}
          error={touched && invalid ? invalid : undefined}
          hint={touched && invalid ? undefined : `At most ${amountLabel(max)}`}
        />
      </div>
    </Modal>
  )
}
