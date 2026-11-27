import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  Car,
  CheckCircle2,
  IndianRupee,
  Pencil,
  Receipt,
  StickyNote,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { Button, Checkbox, Input, LoadingState, Modal, Textarea, WhatsappIcon, useToast } from '@/components/ui'
import { PaymentStatusBadge } from '@/components/common/StatusBadges'
import { useAuth } from '@/context/AuthContext'
import { useJobCardPayments } from '@/hooks/useJobCardPayments'
import { paymentBalanceFromError, paymentService } from '@/services/paymentService'
import { ApiError } from '@/services/httpClient'
import { formatMoney, vehicleDisplayName } from '@/lib/jobCard'
import {
  formatPaymentDate,
  paidBarClass,
  paidPercent,
  parseAmountInput,
  paymentMethodIcon,
  paymentMethodLabel,
  toAmountInputValue,
} from '@/lib/payment'
import {
  customerWhatsappNumber,
  openWhatsapp,
  paymentReceiptMessage,
  whatsappLink,
} from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import type { JobCardRecord } from '@/types/jobCard'
import type { JobCardMoney, PaymentMethod, PaymentRecord } from '@/types/payment'

const NOTE_LIMIT = 250

interface CollectPaymentModalProps {
  /** The card to collect on; `null` keeps the popup closed. */
  jobCard: JobCardRecord | null
  onClose: () => void
  /** Called after any receipt is taken, corrected or cancelled, so the list can refresh. */
  onChanged?: (money: JobCardMoney) => void
  /** Opens the card's items — offered when nothing has been billed yet. */
  onAddItems?: (jobCard: JobCardRecord) => void
}

/**
 * Everything about getting paid for one job card, in a single popup: what is
 * still due, a one-screen form to take money (amount already filled in with
 * the balance), and the history of every payment underneath — with correct,
 * cancel and WhatsApp on each. No page to go to and come back from.
 */
export function CollectPaymentModal({ jobCard, onClose, onChanged, onAddItems }: CollectPaymentModalProps) {
  return (
    <Modal
      open={Boolean(jobCard)}
      onClose={onClose}
      title={jobCard?.status === 'DELIVERED' ? 'Payments' : 'Collect Payment'}
      size="lg"
    >
      {/* Mounted per card, so each open starts fresh and fetches its own history. */}
      {jobCard && (
        <CollectPaymentBody
          key={jobCard.id}
          jobCard={jobCard}
          onChanged={onChanged}
          onAddItems={onAddItems}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function CollectPaymentBody({
  jobCard,
  onChanged,
  onAddItems,
  onClose,
}: {
  jobCard: JobCardRecord
  onChanged?: (money: JobCardMoney) => void
  onAddItems?: (jobCard: JobCardRecord) => void
  onClose: () => void
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { money, payments, loading, error: loadError, reload, applyMoney } = useJobCardPayments(
    jobCard.id,
  )

  /** The receipt being corrected, or `null` while taking a new payment. */
  const [editing, setEditing] = useState<PaymentRecord | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [notify, setNotify] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  /** "₹2,000 collected" — shown for a moment after a save. */
  const [justSaved, setJustSaved] = useState<string | null>(null)

  const vehicle = jobCard.vehicle
  const customer = vehicle?.customer
  const whatsappNumber = customerWhatsappNumber(customer)

  const balance = money?.remainingAmount ?? 0
  const maxAmount = editing ? balance + editing.amount : balance

  // Fill the amount with what is due whenever the balance or the mode changes —
  // collecting the full balance is what happens most of the time.
  useEffect(() => {
    if (!money) return
    if (editing) {
      setAmount(toAmountInputValue(editing.amount))
      setMethod(editing.paymentMethod)
      setNote(editing.note ?? '')
      setShowNote(Boolean(editing.note))
    } else {
      setAmount(money.remainingAmount > 0 ? toAmountInputValue(money.remainingAmount) : '')
      setMethod('CASH')
      setNote('')
      setShowNote(false)
    }
    setFormError(null)
  }, [money, editing])

  const receiptLink = (payment: PaymentRecord, card: JobCardMoney): string | undefined => {
    if (!whatsappNumber) return undefined
    return whatsappLink(
      whatsappNumber,
      paymentReceiptMessage({
        garageName: user?.garageName,
        garageMobile: user?.mobileNumber,
        customerName: customer?.fullName,
        vehicleName: vehicle ? vehicleDisplayName(vehicle) : null,
        vehicleNumber: vehicle?.vehicleNumber,
        jobNumber: card.jobNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        money: card,
      }),
    )
  }

  const settle = (next: JobCardMoney) => {
    applyMoney(next)
    reload()
    onChanged?.(next)
  }

  const validate = (): string | null => {
    const value = parseAmountInput(amount)
    if (!amount.trim() || Number.isNaN(value)) return 'Enter the amount received'
    if (value <= 0) return 'Amount must be more than 0'
    if (value > maxAmount) {
      return maxAmount > 0 ? `Only ${formatMoney(maxAmount)} is due` : 'This bill is already fully paid'
    }
    return null
  }

  const submit = async () => {
    const invalid = validate()
    if (invalid) {
      setFormError(invalid)
      return
    }

    const sendWhatsapp = Boolean(whatsappNumber) && notify
    // Opened on the click itself — a tab opened after the save would be blocked as a pop-up.
    const tab = sendWhatsapp ? window.open('about:blank', '_blank') : null

    setSaving(true)
    setFormError(null)
    const draft = {
      amount: parseAmountInput(amount),
      paymentMethod: method,
      note: note.trim() || null,
    }

    try {
      const result = editing
        ? await paymentService.updatePayment(editing.id, draft)
        : await paymentService.recordPayment({ serviceJobId: jobCard.id, ...draft })

      settle(result.jobCard)
      const link = receiptLink(result.payment, result.jobCard)
      if (tab) {
        if (link) tab.location.href = link
        else tab.close()
      }

      const done = result.jobCard.remainingAmount <= 0
      const msg = editing
        ? 'Payment corrected'
        : `${formatMoney(draft.amount)} collected${done ? ' — bill fully paid' : ''}`
      setJustSaved(msg)
      toast(done ? 'Fully paid — job card marked Delivered' : msg, 'success')
      setEditing(null)
    } catch (cause) {
      tab?.close()
      const fresh = paymentBalanceFromError(cause)
      if (fresh) applyMoney(fresh)
      setFormError(
        cause instanceof ApiError ? cause.message : 'Could not save the payment. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  const cancelReceipt = async (payment: PaymentRecord) => {
    setBusyId(payment.id)
    try {
      const result = await paymentService.deletePayment(payment.id)
      settle(result.jobCard)
      if (editing?.id === payment.id) setEditing(null)
      toast(`${formatMoney(payment.amount)} payment cancelled`, 'success')
    } catch (cause) {
      const fresh = paymentBalanceFromError(cause)
      if (fresh) applyMoney(fresh)
      toast(cause instanceof ApiError ? cause.message : 'Could not cancel the payment.', 'error')
    } finally {
      setBusyId(null)
      setConfirmCancel(null)
    }
  }

  /* ----------------------------- loading / error ----------------------------- */

  if (!money) {
    return loading ? (
      <LoadingState />
    ) : (
      <div className="py-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm font-medium text-slate-900">Could not load the payments</p>
        <p className="mt-1 text-sm text-slate-500">{loadError}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={reload}>
          Try again
        </Button>
      </div>
    )
  }

  const settled = money.remainingAmount <= 0 && !editing
  const nothingBilled = money.totalAmount <= 0
  const percent = paidPercent(money.paidAmount, money.totalAmount)
  const half = Math.round((maxAmount / 2) * 100) / 100
  const typed = parseAmountInput(amount)

  return (
    <div className="space-y-4">
      {/* Who and what this bill is for */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
          {money.jobNumber}
        </span>
        {customer?.fullName && (
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {customer.fullName}
          </span>
        )}
        {vehicle?.vehicleNumber && (
          <span className="inline-flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-slate-400" />
            {vehicle.vehicleNumber}
          </span>
        )}
      </div>

      {/* The three numbers, balance first */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Bill</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900 sm:text-lg">
              {formatMoney(money.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Received</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-emerald-600 sm:text-lg">
              {formatMoney(money.paidAmount)}
            </p>
          </div>
          <div className="rounded-lg bg-white py-1 ring-1 ring-slate-200">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Due</p>
            <p
              className={cn(
                'mt-0.5 text-base font-bold tabular-nums sm:text-lg',
                money.remainingAmount > 0 ? 'text-red-600' : 'text-emerald-600',
              )}
            >
              {formatMoney(money.remainingAmount)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn('h-full rounded-full transition-all', paidBarClass(money.paymentStatus))}
              style={{ width: `${percent}%` }}
            />
          </div>
          <PaymentStatusBadge payment={money.paymentStatus} status={money.status} />
        </div>
      </div>

      {justSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">{justSaved}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setJustSaved(null)}
            className="rounded p-0.5 text-emerald-600 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Take money — or say why there is nothing to take */}
      {nothingBilled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nothing is billed on this job card yet. Add the items (parts and labour) first, then
          collect the payment.
          {onAddItems && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 block"
              onClick={() => onAddItems(jobCard)}
            >
              Add items to the job card
            </Button>
          )}
        </div>
      ) : settled ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-900">Fully paid</p>
            <p className="mt-0.5 text-sm text-emerald-800">
              Nothing is due. The job card is marked Delivered.
            </p>
            {whatsappNumber && payments.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                leftIcon={<WhatsappIcon className="h-4 w-4 text-emerald-600" />}
                onClick={() => {
                  const link = receiptLink(payments[payments.length - 1], money)
                  if (link) openWhatsapp(link)
                }}
              >
                Send full receipt
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'space-y-4 rounded-xl border p-4',
            editing ? 'border-amber-300 bg-amber-50/40' : 'border-primary-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {editing ? 'Correct this payment' : 'Receive payment'}
            </p>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Stop correcting
              </button>
            )}
          </div>

          <div>
            <Input
              id="collectAmount"
              label="Amount received *"
              type="number"
              inputMode="decimal"
              min={0.01}
              max={maxAmount}
              step="0.01"
              disabled={saving}
              className="h-12 text-lg font-semibold"
              leftIcon={<IndianRupee className="h-4 w-4" />}
              error={formError ?? undefined}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setFormError(null)
              }}
            />
            {!editing && maxAmount > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <QuickAmount
                  active={typed === maxAmount}
                  disabled={saving}
                  onClick={() => setAmount(toAmountInputValue(maxAmount))}
                >
                  Full due · {formatMoney(maxAmount)}
                </QuickAmount>
                {half > 0 && half < maxAmount && (
                  <QuickAmount
                    active={typed === half}
                    disabled={saving}
                    onClick={() => setAmount(toAmountInputValue(half))}
                  >
                    Half · {formatMoney(half)}
                  </QuickAmount>
                )}
              </div>
            )}
          </div>

          <PaymentMethodPicker value={method} onChange={setMethod} disabled={saving} />

          {showNote ? (
            <Textarea
              id="collectNote"
              label="Note"
              rows={2}
              maxLength={NOTE_LIMIT}
              disabled={saving}
              placeholder="e.g. Paid by customer's brother"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
            >
              <StickyNote className="h-3.5 w-3.5" /> Add a note (optional)
            </button>
          )}

          {whatsappNumber && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <Checkbox
                id="collectNotify"
                disabled={saving}
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                label={
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    Send receipt on <WhatsappIcon className="h-4 w-4 text-emerald-600" />
                  </span>
                }
              />
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            loading={saving}
            variant={editing ? 'primary' : 'success'}
            leftIcon={<CheckCircle2 className="h-5 w-5" />}
            onClick={() => void submit()}
          >
            {editing
              ? 'Save correction'
              : typed > 0 && !Number.isNaN(typed)
                ? `Receive ${formatMoney(typed)}`
                : 'Receive payment'}
          </Button>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Receipt className="h-4 w-4 text-slate-400" />
          Payment history
          <span className="font-normal text-slate-400">({payments.length})</span>
        </h3>

        {payments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
            No payment received yet.
          </p>
        ) : (
          <ol className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {payments.map((payment, i) => {
              const Icon = paymentMethodIcon(payment.paymentMethod)
              const asking = confirmCancel === payment.id
              const isEditing = editing?.id === payment.id
              return (
                <li
                  key={payment.id}
                  className={cn('bg-white p-3', isEditing && 'bg-amber-50/60')}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          #{i + 1} · {paymentMethodLabel(payment.paymentMethod)}
                        </p>
                        <p className="text-base font-bold tabular-nums text-emerald-700">
                          {formatMoney(payment.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{formatPaymentDate(payment.paymentDate)}</p>
                      {payment.note && (
                        <p className="mt-1 text-xs text-slate-600">“{payment.note}”</p>
                      )}

                      {asking ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-800">
                          <span className="flex-1">
                            Cancel this {formatMoney(payment.amount)} payment? It goes back on the due amount.
                          </span>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busyId === payment.id}
                            onClick={() => void cancelReceipt(payment)}
                          >
                            Yes, cancel
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(null)}>
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {whatsappNumber && (
                            <button
                              type="button"
                              disabled={Boolean(busyId) || saving}
                              onClick={() => {
                                const link = receiptLink(payment, money)
                                if (link) openWhatsapp(link)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <WhatsappIcon className="h-3.5 w-3.5" /> Send
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={Boolean(busyId) || saving}
                            onClick={() => setEditing(payment)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Correct
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(busyId) || saving}
                            onClick={() => setConfirmCancel(payment.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <Button variant="outline" fullWidth onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

function QuickAmount({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[34px] items-center rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-50',
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}
