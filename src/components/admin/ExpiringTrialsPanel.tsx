import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  MapPin,
  PartyPopper,
  RefreshCw,
} from 'lucide-react'
import { Skeleton, WhatsappIcon } from '@/components/ui'
import { formatCount } from '@/lib/dashboard'
import { cn, formatDate, getInitial } from '@/lib/utils'
import { openWhatsapp, toWhatsappNumber, trialReminderMessage, whatsappLink } from '@/lib/whatsapp'
import { adminService } from '@/services/adminService'
import { ApiError } from '@/services/httpClient'
import type { ExpiringTrialsReport } from '@/types/admin'

/** Five calls a page is a list someone can work through, not a report. */
const PAGE_SIZE = 5

/** Red when the trial is all but over, amber otherwise. */
function urgency(days: number): string {
  return days <= 2
    ? 'bg-red-50 text-red-700 ring-red-200'
    : 'bg-amber-50 text-amber-700 ring-amber-200'
}

function daysLabel(days: number): string {
  if (days <= 1) return '1 day left'
  return `${days} days left`
}

/**
 * Free trials running out within the week, soonest first — the garages to remind
 * before their trial lapses. Each row opens a WhatsApp reminder to the owner.
 */
export function ExpiringTrialsPanel() {
  const [page, setPage] = useState(1)
  const [report, setReport] = useState<ExpiringTrialsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    adminService
      .listExpiringTrials({ page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setReport(data)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load expiring trials.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, attempt])

  const rows = report?.garages ?? []
  const pagination = report?.pagination
  const windowDays = report?.windowDays ?? 7

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 pt-6 shadow-card transition-shadow duration-200 hover:shadow-lg">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
            <Hourglass className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">Trials Ending Soon</h2>
            <p className="text-xs text-slate-400">
              Free trials ending in the next {windowDays} days
            </p>
          </div>
        </div>
        {pagination && pagination.total > 0 && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            {formatCount(pagination.total)} to remind
          </span>
        )}
      </div>

      <div className="mt-4">
        {error ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : loading && !report ? (
          <div className="space-y-2">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <PartyPopper className="h-5 w-5 shrink-0" />
            No free trial ends in the next {windowDays} days.
          </div>
        ) : (
          <ul className={cn('divide-y divide-slate-100', loading && 'opacity-60')}>
            {rows.map(({ garage, subscription }) => (
              <li key={subscription.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {getInitial(garage.garageName)}
                </span>

                {/* Three short lines rather than columns, so the row reads the
                    same in a narrow side column as it does on a phone. */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{garage.garageName}</p>
                  <p className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                    <span className="truncate">{garage.ownerName}</span>
                    {garage.city && (
                      <>
                        <MapPin className="ml-1 h-3 w-3 shrink-0" />
                        <span className="truncate">{garage.city}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'inline-block whitespace-nowrap rounded-full px-2 py-px text-[11px] font-semibold ring-1 ring-inset',
                        urgency(subscription.pendingDays),
                      )}
                    >
                      {daysLabel(subscription.pendingDays)}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-slate-400">
                      Ends {formatDate(subscription.endDate)}
                    </span>
                  </p>
                </div>

                {/* The reminder, written and addressed, opened in WhatsApp for
                    the admin to read and send. */}
                {toWhatsappNumber(garage.mobileNumber) && (
                  <button
                    type="button"
                    title={`Send ${garage.ownerName} a subscription reminder on WhatsApp`}
                    aria-label={`Send ${garage.ownerName} a subscription reminder on WhatsApp`}
                    onClick={() =>
                      openWhatsapp(
                        whatsappLink(
                          toWhatsappNumber(garage.mobileNumber) as string,
                          trialReminderMessage({
                            ownerName: garage.ownerName,
                            garageName: garage.garageName,
                            endDate: subscription.endDate,
                            daysLeft: subscription.pendingDays,
                          }),
                        ),
                      )
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 transition-all duration-200 hover:scale-110 hover:bg-[#1ebe5b] hover:shadow-lg hover:shadow-[#25D366]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/30"
                  >
                    <WhatsappIcon className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((n) => n - 1)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((n) => n + 1)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
