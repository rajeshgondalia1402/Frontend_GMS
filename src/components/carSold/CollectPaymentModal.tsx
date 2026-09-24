import { useEffect, useState } from 'react'
import { AlertCircle, IndianRupee } from 'lucide-react'
import { Button, Input, Modal, useToast } from '@/components/ui'
import { carSoldService } from '@/services/carSoldService'
import { ApiError } from '@/services/httpClient'
import { amountLabel } from '@/lib/carSold'
import type { SoldCarRecord } from '@/types/carSold'

interface CollectPaymentModalProps {
  open: boolean
  onClose: () => void
  /** The sold car whose balance is being collected, or `null` while closed. */
  car: SoldCarRecord | null
  /** Called once the receipt is written, so the list can read itself again. */
  onCollected: () => void
}

/** Blank fails; otherwise a positive amount no larger than what is owing. */
function validateAmount(typed: string, owing: number): string | null {
  const amount = typed.trim()
  if (!amount) return 'Enter the amount collected'
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    return 'Enter a positive amount with at most 2 decimal places'
  }
  if (Number(amount) <= 0) return 'Payment must be more than 0'
  if (Number(amount) > owing) {
    return `Payment cannot be more than the ${amountLabel(owing)} pending`
  }
  return null
}

/**
 * Collecting an instalment against a part paid sale, through
 * `POST /api/auth/car-selling/sold-customer/:id/payment`.
 *
 * The amount is checked against what is still owing before it is sent, and
 * again by the API against the live payments — which is the check that counts,
 * since another desk may have taken money since this screen was drawn. A 400
 * from that check is shown as it comes back.
 */
export function CollectPaymentModal({
  open,
  onClose,
  car,
  onCollected,
}: CollectPaymentModalProps) {
  const { toast } = useToast()
  const sale = car?.soldCustomerDetail ?? null

  const [amount, setAmount] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Each sale starts from an empty box rather than the last one's figure.
  useEffect(() => {
    if (!open) return
    setAmount('')
    setTouched(false)
    setError(null)
  }, [open, car?.id])

  if (!car || !sale) return null

  const invalid = validateAmount(amount, sale.remainingAmount)

  const collect = async () => {
    setTouched(true)
    if (invalid) return

    setSaving(true)
    setError(null)

    try {
      const { carSoldCustomer } = await carSoldService.recordCarSoldPayment(sale.id, {
        paymentAmount: Number(amount.trim()),
      })

      toast(
        carSoldCustomer.paymentStatus === 'PAID'
          ? 'Payment collected — this car is now fully paid'
          : `Payment collected — ${amountLabel(carSoldCustomer.remainingAmount)} pending`,
        'success',
      )
      onCollected()
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not record the payment. Please try again.',
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
      title="Collect Payment"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={() => void collect()}>
            Record Payment
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
        <span className="font-semibold text-slate-900">{sale.purchaseOwnerName}</span> still owes
        on <span className="font-semibold text-slate-900">{car.carNumber ?? 'this car'}</span>.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center">
        <div>
          <p className="text-xs text-slate-500">Sale Price</p>
          <p className="text-sm font-semibold text-slate-900">
            {amountLabel(sale.finalSellingPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Paid</p>
          <p className="text-sm font-semibold text-emerald-600">{amountLabel(sale.paidAmount)}</p>
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
          label="Amount Collected *"
          type="number"
          inputMode="decimal"
          min={0}
          max={sale.remainingAmount}
          step="0.01"
          autoFocus
          placeholder={String(sale.remainingAmount)}
          leftIcon={<IndianRupee className="h-4 w-4" />}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => setTouched(true)}
          // Enter takes the money rather than doing nothing in a dialog.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void collect()
            }
          }}
          error={touched && invalid ? invalid : undefined}
          hint={
            touched && invalid ? undefined : `At most ${amountLabel(sale.remainingAmount)}`
          }
        />

        {/* The common case is the buyer clearing the balance in one go. */}
        {sale.remainingAmount > 0 && (
          <button
            type="button"
            onClick={() => setAmount(String(sale.remainingAmount))}
            className="mt-2 text-sm font-medium text-primary-700 hover:underline"
          >
            Collect the full {amountLabel(sale.remainingAmount)}
          </button>
        )}
      </div>
    </Modal>
  )
}
