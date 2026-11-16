import type { Pagination } from './auth'
import type { StaffCategory, StaffStatus } from './staff'

/** How a salary was paid — stored canonical, shown with `salaryModeLabel`. */
export type SalaryPaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'

/** The staff member a salary record belongs to, embedded by the API. */
export interface SalaryStaff {
  id: string
  name: string
  role: string | null
  category: StaffCategory | string
  mobileNumber: string
  status: StaffStatus | string
  /** A deleted staff member's old payments still show in the report. */
  isDelete: boolean
}

/** One row of `GET /api/auth/staff-salary`. */
export interface SalaryRecord {
  id: string
  staffId: string
  amount: number
  /** The month the money is for, `YYYY-MM`. */
  salaryMonth: string
  /** The day it was paid, `YYYY-MM-DD`. */
  paymentDate: string
  paymentMode: SalaryPaymentMode
  remarks: string | null
  createdAt: string
  updatedAt: string
  staff: SalaryStaff
}

export interface SalaryModeTotal {
  paymentMode: SalaryPaymentMode
  amount: number
  count: number
}

/** Counted over the whole filtered result, not just the page shown. */
export interface SalarySummary {
  totalAmount: number
  totalRecords: number
  staffCount: number
  byPaymentMode: SalaryModeTotal[]
}

/** The filters the API actually applied — the dates it fell back to included. */
export interface SalaryFilters {
  fromDate: string | null
  toDate: string | null
  defaultedToCurrentMonth: boolean
  search: string | null
  staffId: string | null
  paymentMode: SalaryPaymentMode | null
}

export interface SalaryListData {
  salaries: SalaryRecord[]
  summary: SalarySummary
  filters: SalaryFilters
  pagination: Pagination
}

export interface SalaryListParams {
  search?: string
  /** `YYYY-MM-DD`. Leave both dates off for the current month. */
  fromDate?: string
  toDate?: string
  staffId?: string
  paymentMode?: SalaryPaymentMode
  page?: number
  limit?: number
  sortBy?: 'paymentDate' | 'salaryMonth' | 'amount' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface SalaryPayload {
  staffId: string
  amount: number
  /** `YYYY-MM` */
  salaryMonth: string
  /** `YYYY-MM-DD` */
  paymentDate: string
  paymentMode: SalaryPaymentMode
  remarks?: string | null
}
