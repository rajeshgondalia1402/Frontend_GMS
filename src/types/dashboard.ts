/** Types mirroring the Node.js API contract for `/api/auth/dashboard`. */
import type { Pagination } from './auth'
import type { VehicleStatus } from './vehicle'
import type { JobCardStatus, JobPaymentStatus } from './jobCard'
import type { PaymentMethod } from './payment'

/**
 * The window the "this month" figures were counted over — midnight on the 1st
 * up to the moment the summary was taken, on the **server's** calendar.
 *
 * It comes back with the figures so the screen can name the month it is
 * showing rather than working it out from the browser's own clock, which may
 * be a day either side of the server's.
 */
export interface DashboardMonth {
  startDate: string
  endDate: string
}

/** Counted by `createdAt`, like the vehicles and the job cards. */
export interface DashboardCustomers {
  thisMonth: number
}

export interface DashboardVehicles {
  thisMonth: number
  /** Waiting to be worked on. All time, not this month. */
  pending: number
  /** On the ramp right now. All time, not this month. */
  inService: number
}

export interface DashboardJobCards {
  thisMonth: number
  /**
   * Cards with nothing collected against them, and cards part collected.
   *
   * Both are all time rather than this month: an unpaid bill from March is
   * still owed in September, and a month boundary would hide exactly what a
   * garage opens this screen to see.
   */
  unpaid: number
  partiallyPaid: number
}

/** Money **collected**, counted by the date each payment came in. */
export interface DashboardRevenue {
  total: number
  thisMonth: number
}

/**
 * `GET /api/auth/dashboard/summary` — every tile on the dashboard in one
 * answer, so the screen does not open with a dozen requests racing each other.
 *
 * A garage with nothing on it yet is a 200 with zeros all the way down, never
 * a 404: having no customers on the first day is a normal state of a garage.
 */
export interface DashboardSummary {
  month: DashboardMonth
  customers: DashboardCustomers
  vehicles: DashboardVehicles
  jobCards: DashboardJobCards
  revenue: DashboardRevenue
}

/** One bar on each of the dashboard's two monthly charts. */
export interface DashboardChartMonth {
  /** 1 for January, 12 for December. */
  month: number
  /** `Jan` … `Dec`. */
  label: string
  /** Money **collected** that month, by the date each payment came in. */
  revenue: number
  /** Job cards opened that month — one per vehicle brought in for service. */
  jobCards: number
}

/**
 * `GET /api/auth/dashboard/monthly?year=2026` — revenue and job cards month by
 * month. The current year runs January to the month running now; a past year
 * is all twelve.
 */
export interface DashboardMonthlyChart {
  year: number
  /** The years the dropdown offers, newest first. */
  years: number[]
  months: DashboardChartMonth[]
}

/** One of up to three vehicles shown beside a new customer. */
export interface DashboardNewCustomerVehicle {
  id: string
  vehicleNumber: string
  brand: string | null
  model: string | null
}

/** One row of the "New Customers" panel. */
export interface DashboardNewCustomer {
  id: string
  fullName: string
  mobileNumber: string
  whatsappNumber: string
  email: string | null
  city: string | null
  createdAt: string
  /** Every live vehicle the customer has, not just the ones in `vehicles`. */
  vehicleCount: number
  /** The newest three, for recognising the customer by the car. */
  vehicles: DashboardNewCustomerVehicle[]
}

/**
 * `GET /api/auth/dashboard/new-customers?page=&limit=` — the customers behind
 * the "New Customers" tile, a page at a time. Counted over the same window as
 * the tile, so `pagination.total` is always the tile's number.
 */
export interface DashboardNewCustomersPage {
  month: DashboardMonth
  customers: DashboardNewCustomer[]
  pagination: Pagination
}

/** The owner shown beside a new vehicle. */
export interface DashboardNewVehicleCustomer {
  id: string
  fullName: string
  mobileNumber: string
  city: string | null
}

/** One row of the "New Vehicles" panel. */
export interface DashboardNewVehicle {
  id: string
  vehicleNumber: string
  vehicleType: string
  brand: string | null
  model: string | null
  variant: string | null
  fuelType: string | null
  color: string | null
  status: VehicleStatus
  currentKm: number | null
  createdAt: string
  customer: DashboardNewVehicleCustomer
  /** Live job cards opened against the vehicle so far. */
  jobCardCount: number
}

/**
 * A page of vehicles with their owners — `/new-vehicles`, `/pending-vehicles`
 * and `/in-service-vehicles`. Only `/new-vehicles` sends `month`.
 */
export interface DashboardVehiclesPage {
  month?: DashboardMonth
  vehicles: DashboardNewVehicle[]
  pagination: Pagination
}

/** The vehicle a new job card was opened on, with its owner. */
export interface DashboardNewJobCardVehicle {
  id: string
  vehicleNumber: string
  vehicleType: string
  brand: string | null
  model: string | null
  customer: {
    id: string
    fullName: string
    mobileNumber: string
  }
}

/** One row of the "New Job Cards" panel. */
export interface DashboardNewJobCard {
  id: string
  jobNumber: string
  serviceDate: string
  status: JobCardStatus
  paymentStatus: JobPaymentStatus
  completionDate: string | null
  createdAt: string
  vehicle: DashboardNewJobCardVehicle
  assignedStaff: { id: string; name: string } | null
  /** After the discount. */
  totalAmount: number
  discount: number
  /** From the card's live receipts. */
  paidAmount: number
  /** What is still owed; never below 0. */
  balance: number
  /** Live lines on the card. */
  itemCount: number
}

/**
 * A page of job cards with vehicle, owner and money — `/new-job-cards`,
 * `/unpaid-bills` and `/partially-paid-bills`. Only `/new-job-cards` sends `month`.
 */
export interface DashboardJobCardsPage {
  month?: DashboardMonth
  jobCards: DashboardNewJobCard[]
  pagination: Pagination
}

/** One payment method's share of a month's revenue. */
export interface DashboardRevenueByMethod {
  paymentMethod: PaymentMethod
  total: number
  count: number
}

/** One receipt behind a month's revenue, with the job card it was taken against. */
export interface DashboardRevenuePayment {
  id: string
  paymentDate: string
  amount: number
  paymentMethod: PaymentMethod
  receivedBy: string
  note: string | null
  serviceJob: {
    id: string
    jobNumber: string
    vehicle: {
      id: string
      vehicleNumber: string
      brand: string | null
      model: string | null
      customer: { id: string; fullName: string; mobileNumber: string }
    }
  }
}

/**
 * `GET /api/auth/dashboard/monthly/revenue?year=&month=&page=&limit=` — one bar
 * of the revenue chart opened up. `total` is always exactly that bar's height.
 */
export interface DashboardRevenueMonth {
  year: number
  /** 1 for January, 12 for December. */
  month: number
  /** `Sep 2026`. */
  label: string
  period: { startDate: string; endDate: string }
  total: number
  /** How many receipts make up `total`. */
  count: number
  /** Biggest first. */
  byMethod: DashboardRevenueByMethod[]
  /** Newest first, one page of them. */
  payments: DashboardRevenuePayment[]
  pagination: Pagination
}

/**
 * `GET /api/auth/dashboard/monthly/job-cards?year=&month=&page=&limit=` — one
 * bar of the vehicle services chart opened up. `count` is always exactly that
 * bar's height.
 */
export interface DashboardJobCardsMonth {
  year: number
  /** 1 for January, 12 for December. */
  month: number
  /** `Sep 2026`. */
  label: string
  period: { startDate: string; endDate: string }
  /** Job cards opened that month. */
  count: number
  /** What they were billed, after discounts. */
  totalBilled: number
  byStatus: { pending: number; delivered: number }
  byPaymentStatus: { unpaid: number; partiallyPaid: number; paid: number }
  /** Newest first, one page of them — the same rows as the job card lists. */
  jobCards: DashboardNewJobCard[]
  pagination: Pagination
}

/** Which of the two revenue reports — the tile, and the menu entry, it belongs to. */
export type RevenueReportKind = 'total' | 'month'

/** One receipt on a revenue report, with the job card it was taken against. */
export interface RevenueReportPayment {
  id: string
  paymentDate: string
  amount: number
  paymentMethod: PaymentMethod
  receivedBy: string
  note: string | null
  serviceJob: {
    id: string
    jobNumber: string
    serviceDate: string
    /** The card's bill, after the discount. */
    totalAmount: number
    paymentStatus: JobPaymentStatus
    vehicle: {
      id: string
      vehicleNumber: string
      brand: string | null
      model: string | null
      customer: { id: string; fullName: string; mobileNumber: string }
    }
  }
}

/** One month (total revenue) or one day (this month) of the report's trend. */
export interface RevenueReportTrendPoint {
  /** `2026-09` for a month, `2026-09-05` for a day. */
  key: string
  /** `Sep 2026`, or `05 Sep`. */
  label: string
  total: number
  count: number
}

/** The filters a revenue report can be narrowed by. */
export interface RevenueReportQuery {
  page: number
  limit: number
  paymentMethod?: PaymentMethod | ''
  search?: string
  /** `YYYY-MM-DD`, inclusive. Total revenue only. */
  fromDate?: string
  toDate?: string
}

/**
 * `GET /api/auth/dashboard/reports/total-revenue` and `/revenue-this-month` —
 * a revenue report. With no filters `summary.total` is the number on the tile
 * that opened it.
 */
export interface RevenueReport {
  report: 'TOTAL_REVENUE' | 'REVENUE_THIS_MONTH'
  title: string
  /** `Oct 2026` — this month's report only. */
  label?: string
  /** `startDate` is null for an all-time report with no from date. */
  period: { startDate: string | null; endDate: string }
  firstPaymentDate: string | null
  lastPaymentDate: string | null
  filters: {
    paymentMethod: PaymentMethod | null
    search: string | null
    fromDate?: string | null
    toDate?: string | null
  }
  summary: {
    total: number
    /** Receipts. */
    count: number
    average: number
    highest: number
    /** Distinct job cards and customers the money came from. */
    jobCards: number
    customers: number
  }
  /** Biggest first. */
  byMethod: DashboardRevenueByMethod[]
  trendUnit: 'month' | 'day'
  trend: RevenueReportTrendPoint[]
  /** Newest first, one page of them. */
  payments: RevenueReportPayment[]
  pagination: Pagination
}
