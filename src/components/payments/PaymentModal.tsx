import { useEffect, useState } from 'react'
import { IndianRupee, Wallet } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Textarea, WhatsappIcon } from '@/components/ui'
import { formatMoney } from '@/lib/jobCard'
import { parseAmountInput, toAmountInputValue } from '@/lib/payment'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import type { PaymentMethod, PaymentRecord } from '@/types/payment'

export interface PaymentDraft {
  amount: number
  paymentMethod: PaymentMethod
  note: string | null
}

/** What saving the receipt answered with. */
export interface PaymentSaveResult {
  /**
   * Why it was refused, to show against the amount. Absent once the receipt
   * has landed.
   */
  error?: string
  /**
   * The customer's copy of the receipt it just saved, ready to hand to
   * WhatsApp. Only the page knows the garage, the customer and the fresh
   * balance, so it is the page that writes it.
   */
  whatsappLink?: string
}

interface PaymentModalProps {
  open: boolean
  /** The receipt being corrected; `null` records a new one. */
  payment: PaymentRecord | null
  /**
   * The most this receipt may be. For a new one that is the card's balance; for
   * a correction it is the balance with this receipt's own share added back,
   * since the API takes that out of the sum before it checks.
   */
  maxAmount: number
  /**
   * The customer's WhatsApp number, already in `wa.me` form. Without one
   * there is nobody to send the receipt to, so the offer is not made.
   */
  whatsappNumber?: string | null
  /**
   * Saves it. `error` is shown against the amount — that is where "only
   * 2000.00 is left to pay" belongs — and keeps the modal open; anything
   * else closes it.
   */
  onSubmit: (draft: PaymentDraft) => Promise<PaymentSaveResult>
  onClose: () => void
}

const NOTE_LIMIT = 250

export function PaymentModal({
  open,
  payment,
  maxAmount,
  whatsappNumber,
  onSubmit,
  onClose,
}: PaymentModalProps) {
  const isEdit = Boolean(payment)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Sending the customer their receipt is the normal end of taking money, so
  // it is on by default wherever there is a number to send it to.
  const [notify, setNotify] = useState(true)

  // Load the receipt being corrected — or start a fresh one on the balance,
  // which is what the desk reaches for most often — each time it opens.
  useEffect(() => {
    if (!open) return

    setAmount(toAmountInputValue(payment ? payment.amount : maxAmount))
    setMethod(payment?.paymentMethod ?? 'CASH')
    setNote(payment?.note ?? '')
    setError(null)
    setSaving(false)
    setNotify(true)
  }, [open, payment, maxAmount])

  /** The same rules the API applies, so the common refusals never leave here. */
  const validate = (): string | null => {
    const value = parseAmountInput(amount)

    if (!amount.trim() || Number.isNaN(value)) return 'Enter the amount taken'
    if (value <= 0) return 'Amount must be more than 0'
    if (value > maxAmount) {
      return maxAmount > 0
        ? `Only ${formatMoney(maxAmount)} is left to pay`
        : 'This job card is already fully paid'
    }
    return null
  }

  const canNotify = Boolean(whatsappNumber)

  const submit = async (sendWhatsapp: boolean) => {
    const invalid = validate()
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)

    // Claimed on the click itself. A tab opened after the save has come back
    // is a pop-up as far as the browser is concerned and gets blocked, so a
    // blank one is taken here and pointed at WhatsApp once there is a receipt
    // to send.
    const tab = sendWhatsapp ? window.open('about:blank', '_blank') : null

    const result = await onSubmit({
      amount: parseAmountInput(amount),
      paymentMethod: method,
      note: note.trim() || null,
    })

    // A refusal keeps the modal open with what was typed still in it, so the
    // amount can be corrected rather than entered again from scratch.
    if (result.error) {
      tab?.close()
      setError(result.error)
      setSaving(false)
      return
    }

    if (tab) {
      if (result.whatsappLink) tab.location.href = result.whatsappLink
      else tab.close()
    }

    onClose()
  }

  const remainingLabel = isEdit ? 'Most this receipt may be' : 'Balance on this card'

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Correct Receipt' : 'Record Payment'}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            loading={saving}
            leftIcon={canNotify && notify ? <WhatsappIcon className="h-4 w-4" /> : undefined}
            onClick={() => void submit(canNotify && notify)}
          >
            {isEdit ? 'Save Receipt' : 'Record Payment'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Wallet className="h-4 w-4 text-slate-400" />
            {remainingLabel}
          </span>
          <span className="text-base font-bold tabular-nums text-slate-900">
            {formatMoney(maxAmount)}
          </span>
        </div>

        <div>
          <Input
            id="paymentAmount"
            label="Amount *"
            type="number"
            inputMode="decimal"
            min={0.01}
            max={maxAmount}
            step="0.01"
            placeholder="2000"
            autoFocus
            disabled={saving}
            leftIcon={<IndianRupee className="h-4 w-4" />}
            error={error ?? undefined}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(null)
            }}
          />
          {/* The whole balance in one tap — how most bills are actually settled. */}
          {maxAmount > 0 && parseAmountInput(amount) !== maxAmount && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setAmount(toAmountInputValue(maxAmount))
                setError(null)
              }}
              className="mt-1.5 text-xs font-medium text-primary-600 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Pay the full {formatMoney(maxAmount)}
            </button>
          )}
        </div>

        <PaymentMethodPicker value={method} onChange={setMethod} disabled={saving} />

        <div>
          <Textarea
            id="paymentNote"
            label="Note"
            rows={2}
            maxLength={NOTE_LIMIT}
            disabled={saving}
            placeholder="Paid by the customer's brother"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="mt-1.5 text-right text-xs text-slate-400">
            {note.length}/{NOTE_LIMIT}
          </p>
        </div>

        {/*
          The receipt goes out the moment the money is in, which is when the
          balance printed on it is right. WhatsApp opens with the message
          written and waiting — nothing is sent until the owner presses send
          there, so it can still be read over or edited first.
        */}
        {canNotify && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
            <Checkbox
              id="notifyWhatsapp"
              disabled={saving}
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              label={
                <span className="flex items-center gap-1.5 text-emerald-900">
                  Send the receipt on
                  <WhatsappIcon className="h-4 w-4 text-emerald-600" />
                </span>
              }
              hint="Opens WhatsApp with the receipt ready — you still press send."
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
