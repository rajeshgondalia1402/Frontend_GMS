import { apiRequest } from './httpClient'
import type {
  DashboardMonthlyChart,
  DashboardNewCustomersPage,
  DashboardJobCardsMonth,
  DashboardRevenueMonth,
  DashboardJobCardsPage,
  DashboardVehiclesPage,
  DashboardSummary,
  RevenueReport,
  RevenueReportKind,
  RevenueReportQuery,
} from '@/types/dashboard'

/**
 * `GET /api/auth/dashboard/summary` — the whole top of the dashboard in one
 * call: how many customers, vehicles and job cards the garage has, how many of
 * each were opened this month, what has been collected, and what is still
 * waiting on it.
 *
 * Every figure is counted for the garage the token belongs to, so nothing is
 * sent with it.
 */
export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/auth/dashboard/summary')
}

/**
 * `GET /api/auth/dashboard/monthly?year=` — revenue and job cards month by
 * month for the bar charts. Without a year the server uses the current one.
 */
export function getDashboardMonthly(year?: number): Promise<DashboardMonthlyChart> {
  const query = year ? `?year=${year}` : ''
  return apiRequest<DashboardMonthlyChart>(`/auth/dashboard/monthly${query}`)
}

/**
 * `GET /api/auth/dashboard/new-customers?page=&limit=` — the customers added
 * this month, newest first. The server defaults to 5 a page.
 */
export function getDashboardNewCustomers(
  page: number,
  limit: number,
): Promise<DashboardNewCustomersPage> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest<DashboardNewCustomersPage>(`/auth/dashboard/new-customers?${query}`)
}

/**
 * `GET /api/auth/dashboard/new-vehicles?page=&limit=` — the vehicles added
 * this month with their owners, newest first. The server defaults to 5 a page.
 */
export function getDashboardNewVehicles(
  page: number,
  limit: number,
): Promise<DashboardVehiclesPage> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest<DashboardVehiclesPage>(`/auth/dashboard/new-vehicles?${query}`)
}

/**
 * `GET /api/auth/dashboard/new-job-cards?page=&limit=` — the job cards opened
 * this month with vehicle, owner and payment, newest first. The server
 * defaults to 5 a page.
 */
export function getDashboardNewJobCards(
  page: number,
  limit: number,
): Promise<DashboardJobCardsPage> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest<DashboardJobCardsPage>(`/auth/dashboard/new-job-cards?${query}`)
}

/**
 * `GET /api/auth/dashboard/monthly/revenue?year=&month=&page=&limit=` — one
 * bar of the revenue chart opened up: the month's total, its split by payment
 * method, and the receipts behind it, newest first.
 */
export function getDashboardRevenueMonth(
  year: number,
  month: number,
  page: number,
  limit: number,
): Promise<DashboardRevenueMonth> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
    page: String(page),
    limit: String(limit),
  })
  return apiRequest<DashboardRevenueMonth>(`/auth/dashboard/monthly/revenue?${query}`)
}

/**
 * `GET /api/auth/dashboard/monthly/job-cards?year=&month=&page=&limit=` — one
 * bar of the vehicle services chart opened up: the job cards opened that
 * month, with their status and payment split, newest first.
 */
export function getDashboardJobCardsMonth(
  year: number,
  month: number,
  page: number,
  limit: number,
): Promise<DashboardJobCardsMonth> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
    page: String(page),
    limit: String(limit),
  })
  return apiRequest<DashboardJobCardsMonth>(`/auth/dashboard/monthly/job-cards?${query}`)
}

/** `?page=&limit=` for one of the dashboard's panel lists. */
function pageQuery(page: number, limit: number): string {
  return new URLSearchParams({ page: String(page), limit: String(limit) }).toString()
}

/**
 * The four "Needs Attention" lists behind the tiles of the same name. All
 * time, not this month, and oldest first — the server's default for these —
 * so what has waited longest is on top. 5 a page by default.
 */
export function getDashboardPendingVehicles(page: number, limit: number) {
  return apiRequest<DashboardVehiclesPage>(
    `/auth/dashboard/pending-vehicles?${pageQuery(page, limit)}`,
  )
}

export function getDashboardInServiceVehicles(page: number, limit: number) {
  return apiRequest<DashboardVehiclesPage>(
    `/auth/dashboard/in-service-vehicles?${pageQuery(page, limit)}`,
  )
}

export function getDashboardUnpaidBills(page: number, limit: number) {
  return apiRequest<DashboardJobCardsPage>(`/auth/dashboard/unpaid-bills?${pageQuery(page, limit)}`)
}

export function getDashboardPartiallyPaidBills(page: number, limit: number) {
  return apiRequest<DashboardJobCardsPage>(
    `/auth/dashboard/partially-paid-bills?${pageQuery(page, limit)}`,
  )
}

const REVENUE_REPORT_PATHS: Record<RevenueReportKind, string> = {
  total: '/auth/dashboard/reports/total-revenue',
  month: '/auth/dashboard/reports/revenue-this-month',
}

/**
 * `GET /api/auth/dashboard/reports/total-revenue` or `/revenue-this-month` —
 * a revenue report: its totals, split by payment method and by month (or
 * day), and one page of the receipts, newest first. Empty filters are left
 * off; the dates only mean anything to the total revenue report.
 */
export function getRevenueReport(
  kind: RevenueReportKind,
  { page, limit, paymentMethod, search, fromDate, toDate }: RevenueReportQuery,
): Promise<RevenueReport> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (paymentMethod) query.set('paymentMethod', paymentMethod)
  if (search?.trim()) query.set('search', search.trim())
  if (kind === 'total') {
    if (fromDate) query.set('fromDate', fromDate)
    if (toDate) query.set('toDate', toDate)
  }
  return apiRequest<RevenueReport>(`${REVENUE_REPORT_PATHS[kind]}?${query}`)
}

export const dashboardService = {
  getRevenueReport,
  getDashboardPendingVehicles,
  getDashboardInServiceVehicles,
  getDashboardUnpaidBills,
  getDashboardPartiallyPaidBills,
  getDashboardSummary,
  getDashboardMonthly,
  getDashboardRevenueMonth,
  getDashboardJobCardsMonth,
  getDashboardNewCustomers,
  getDashboardNewVehicles,
  getDashboardNewJobCards,
}
