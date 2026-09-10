import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Plus,
  Receipt,
  User,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  WhatsappIcon,
  useToast,
} from '@/components/ui'
import { PaymentHistory, PaymentModal, PaymentSummary } from '@/components/payments'
import type { PaymentDraft, PaymentSaveResult } from '@/components/payments'
import { useAuth } from '@/context/AuthContext'
import { useJobCardPayments } from '@/hooks/useJobCardPayments'
import { getJobCard } from '@/services/jobCardService'
import { paymentBalanceFromError, paymentService } from '@/services/paymentService'
import { ApiError } from '@/services/httpClient'
import {
  formatMoney,
  jobCardStatusLabel,
  jobCardStatusTone,
  vehicleDisplayName,
} from '@/lib/jobCard'
import {
  customerWhatsappNumber,
  openWhatsapp,
  paymentReceiptMessage,
  whatsappLink,
} from '@/lib/whatsapp'
import type { JobCardRecord } from '@/types/jobCard'
import type { JobCardMoney, PaymentRecord } from '@/types/payment'

/**
 * Collecting the money on one job card.
 *
 * A bill is rarely settled in one go — part cash now, the rest on UPI when the
 * vehicle is collected — so this screen is the balance, the row of ways to take
 * money, and the history of what has come in so far. The card settles itself:
 * the last receipt takes it to PAID and hands the vehicle back, which is why
 * the status badge at the top is watched rather than set here.
 */
export function JobCardPayment() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  // The receipt goes out over the garage’s name, not the app’s.
  const { user } = useAuth()

  const { money, payments, loading, error, reload, applyMoney } = useJobCardPayments(id)

  // The customer and the vehicle, for the context strip. What the list handed
  // over paints it straight away; the fetch behind makes a pasted link work.
  const handed = (location.state as { jobCard?: JobCardRecord } | null)?.jobCard
  const [card, setCard] = useState<JobCardRecord | null>(handed?.id === id ? handed : null)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    getJobCard(id)
      .then((fetched) => !cancelled && setCard(fetched))
      // The money is what this screen is for; the context strip simply stays
      // with whatever it already had.
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [id])

  const [modal, setModal] = useState<{ open: boolean; payment: PaymentRecord | null }>({
    open: false,
    payment: null,
  })
  const [cancelling, setCancelling] = useState<PaymentRecord | null>(null)
  const [busy, setBusy] = useState(false)

  // Who the receipt is about. Both come off the card, which is fetched behind
  // the money, so they are not there on the first paint.
  const vehicle = card?.vehicle
  const customer = vehicle?.customer
  const whatsappNumber = customerWhatsappNumber(customer)

  /**
   * One receipt written out for the customer, as a link that opens WhatsApp
   * with it already typed in. `undefined` when there is no number on file —
   * that is what takes the offer to send it off the screen.
   */
  const receiptLink = (
    payment: PaymentRecord,
    jobCard: JobCardMoney,
  ): string | undefined => {
    if (!whatsappNumber) return undefined

    return whatsappLink(
      whatsappNumber,
      paymentReceiptMessage({
        garageName: user?.garageName,
        garageMobile: user?.mobileNumber,
        customerName: customer?.fullName,
        vehicleName: vehicle ? vehicleDisplayName(vehicle) : null,
        vehicleNumber: vehicle?.vehicleNumber,
        jobNumber: jobCard.jobNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        money: jobCard,
      }),
    )
  }

  /**
   * Sends a receipt that is already on the card. The balance it quotes is the
   * card as it stands now rather than as it stood when that money came in,
   * which is what the customer is ringing to ask about.
   */
  const sendReceipt = (payment: PaymentRecord) => {
    const link = money ? receiptLink(payment, money) : undefined
    if (link) openWhatsapp(link)
  }

  /**
   * Saves the modal's receipt. Resolves with the refusal to show against the
   * amount, or with the customer's copy of it once it has landed.
   *
   * Every refusal the API can raise here — more than the balance, an already
   * settled card, a card with nothing billed on it — carries the same money
   * block a success does, so a stale balance corrects itself on screen instead
   * of needing another request.
   */
  const saveReceipt = async (draft: PaymentDraft): Promise<PaymentSaveResult> => {
    try {
      const result = modal.payment
        ? await paymentService.updatePayment(modal.payment.id, draft)
        : await paymentService.recordPayment({ serviceJobId: id, ...draft })

      applyMoney(result.jobCard)
      reload()

      toast(
        result.jobCard.remainingAmount <= 0
          ? 'Bill settled — the card is marked Delivered'
          : `${formatMoney(result.jobCard.remainingAmount)} left to pay`,
        'success',
      )

      // Written from the answer rather than from what is on screen: the API
      // settles the card off the payments themselves, so the balance the
      // customer is quoted is the one it just worked out.
      return { whatsappLink: receiptLink(result.payment, result.jobCard) }
    } catch (cause) {
      const balance = paymentBalanceFromError(cause)
      if (balance) applyMoney(balance)

      return {
        error:
          cause instanceof ApiError
            ? cause.message
            : 'Could not record the payment. Please try again.',
      }
    }
  }

  const cancelReceipt = async (payment: PaymentRecord) => {
    setBusy(true)
    try {
      const result = await paymentService.deletePayment(payment.id)
      applyMoney(result.jobCard)
      reload()
      toast('Receipt cancelled', 'success')
    } catch (cause) {
      const balance = paymentBalanceFromError(cause)
      if (balance) applyMoney(balance)
      toast(
        cause instanceof ApiError ? cause.message : 'Could not cancel the receipt.',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  const backLink = (
    <button
      onClick={() => navigate('/app/job-cards')}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Job Cards
    </button>
  )

  if (!money) {
    return (
      <div>
        {backLink}
        {loading ? (
          <LoadingState />
        ) : (
          <ErrorState
            title="Could not load the payments"
            description={error ?? 'Open the card again from the list.'}
            onRetry={reload}
          />
        )}
      </div>
    )
  }

  const settled = money.remainingAmount <= 0
  const nothingBilled = money.totalAmount <= 0

  /**
   * A correction may be anything the card can take once this receipt's own
   * share is out of the sum, which is what the API checks against — so a
   * receipt can always be edited back down to what it was.
   */
  const maxAmount = modal.payment
    ? money.remainingAmount + modal.payment.amount
    : money.remainingAmount

  return (
    <div>
      {backLink}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Payment</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Job card {money.jobNumber}
            {customer?.fullName && ` · ${customer.fullName}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={jobCardStatusTone(money.status)}>{jobCardStatusLabel(money.status)}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/app/job-cards/${id}`, { state: { jobCard: card } })}
          >
            View card
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <PaymentSummary money={money} />

          {nothingBilled ? (
            <Card className="border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-800">
                There is nothing to pay on this card yet — add the billable items to it
                first, and the bill total will show up here.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => navigate(`/app/job-cards/${id}/edit`, { state: { jobCard: card } })}
              >
                Add items to the card
              </Button>
            </Card>
          ) : settled ? (
            <Card className="flex items-start gap-3 border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-900">This bill is settled</p>
                <p className="mt-0.5 text-sm text-emerald-800">
                  The card is marked Delivered. Cancelling or correcting a receipt below
                  puts it back to Pending with a balance owing.
                </p>
                {whatsappNumber && payments.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    title="Send the full receipt on WhatsApp"
                    leftIcon={<WhatsappIcon className="h-4 w-4 text-emerald-600" />}
                    onClick={() => sendReceipt(payments[payments.length - 1])}
                  >
                    Send full receipt
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Button
              fullWidth
              size="lg"
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={busy}
              onClick={() => setModal({ open: true, payment: null })}
            >
              Record Payment
            </Button>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Receipt className="h-4 w-4 text-slate-400" />
                Receipts ({payments.length})
              </h2>
              {!settled && !nothingBilled && payments.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Plus className="h-4 w-4" />}
                  disabled={busy}
                  onClick={() => setModal({ open: true, payment: null })}
                >
                  Add
                </Button>
              )}
            </div>
            <PaymentHistory
              payments={payments}
              busy={busy}
              onEdit={(payment) => setModal({ open: true, payment })}
              onCancel={setCancelling}
              onWhatsapp={whatsappNumber ? sendReceipt : undefined}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4 text-slate-400" /> Customer
            </div>
            <p className="font-medium text-slate-900">{customer?.fullName ?? '—'}</p>
            <p className="text-sm text-slate-500">{customer?.mobileNumber ?? '—'}</p>
            {!whatsappNumber && (
              <p className="mt-2 text-xs text-amber-700">
                No WhatsApp number on file, so a receipt cannot be sent from here.
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Car className="h-4 w-4 text-slate-400" /> Vehicle
            </div>
            <p className="font-medium text-slate-900">
              {vehicle ? vehicleDisplayName(vehicle) : '—'}
            </p>
            <p className="font-mono text-sm text-slate-500">{vehicle?.vehicleNumber ?? '—'}</p>
          </Card>

          {card?.items && card.items.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                What the bill is for
              </h2>
              <div className="divide-y divide-slate-100">
                {card.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-2">
                    <p className="min-w-0 text-sm text-slate-600">{item.description}</p>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-slate-900">
                      {formatMoney(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <PaymentModal
        open={modal.open}
        payment={modal.payment}
        maxAmount={maxAmount}
        whatsappNumber={whatsappNumber}
        onSubmit={saveReceipt}
        onClose={() => setModal({ open: false, payment: null })}
      />

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this receipt?"
        message={
          cancelling
            ? `${formatMoney(cancelling.amount)} goes back onto the balance. The card keeps the record that it was taken and then cancelled.`
            : ''
        }
        confirmLabel="Cancel receipt"
        danger
        onClose={() => setCancelling(null)}
        onConfirm={() => {
          if (cancelling) void cancelReceipt(cancelling)
        }}
      />
    </div>
  )
}
