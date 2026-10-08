/** Types mirroring the Node.js API contract for `/api/admin`. */

import type { Pagination } from './auth'
import type { JobCardRecord } from './jobCard'

/**
 * The platform admin behind `POST /api/admin/login`.
 * `id` is a **number** here (the `AdminLogin` table), not the UUID a garage
 * owner gets — which is the clearest signal that this is a different account
 * type on a different token.
 */
export interface AdminUser {
  id: number
  name: string
  mobileNumber: string
}

export interface AdminLoginPayload {
  mobileNumber: string
  password: string
}

/** `POST /api/admin/login` — the same envelope as the garage login. */
export interface AdminLoginData {
  token: string
  /** Human readable token lifetime returned by the API, e.g. `"30d"`. */
  expiresIn: string
  /** ISO timestamp at which the token stops being valid. */
  expiresAt: string
  admin: AdminUser
}

/** What we persist locally so a refresh keeps the admin signed in. */
export interface AdminSession {
  token: string
  expiresIn: string
  expiresAt: string
  admin: AdminUser
}

/** `POST /api/admin/change-password` — the admin id comes from the token. */
export interface AdminChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface AdminChangePasswordData {
  id: number
  mobileNumber: string
  passwordChangedAt: string
}

/** The plans a garage can be on. `?plan=` takes exactly these. */
export type SubscriptionPlan = 'FREE_TRIAL' | 'MONTHLY' | 'YEARLY'

/**
 * The **stored** subscription column. It is not the same thing as "has run
 * out": a row can still read `ACTIVE` after its end date — `isExpired` is the
 * state worked out from the date.
 */
export type SubscriptionRecordStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

/** The garage half of a report row. */
export interface GarageReportGarage {
  id: string
  ownerName: string
  mobileNumber: string
  garageName: string
  city: string | null
  email: string | null
  address: string | null
  gstNo: string | null
  workingDays: string | null
  workingHours: string | null
  registeredAt: string
}

/** The subscription half of a report row, with the day counts worked out. */
export interface GarageReportSubscription {
  id: string
  planId: number
  plan: SubscriptionPlan
  price: number
  durationDays: number
  status: SubscriptionRecordStatus
  startDate: string
  endDate: string
  /** Days still to run; `0` once it has run out, never negative. */
  pendingDays: number
  /** How long ago it ran out; `0` while it is still live. */
  expiredDaysAgo: number
  isExpired: boolean
  /** Still live, and runs out within the API's "soon" window (7 days). */
  expiringSoon: boolean
}

export interface GarageReportRow {
  garage: GarageReportGarage
  subscription: GarageReportSubscription
}

export type GarageReportSortBy =
  | 'createdAt'
  | 'ownerName'
  | 'garageName'
  | 'city'
  | 'plan'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'pendingDays'

/**
 * Query for `GET /api/admin/report/garages`; every field falls back to an API
 * default, and every filter combines with `search` and with the others.
 */
export interface GarageReportParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. */
  limit?: number
  /** Owner name, garage name, city, email or mobile number, all at once. */
  search?: string
  plan?: SubscriptionPlan
  /** The stored column. */
  status?: SubscriptionRecordStatus
  /** The derived state, from the end date. */
  expired?: boolean
  /**
   * Only what is still live and runs out within N days. The API answers 400 if
   * this is sent with `expired: true`.
   */
  expiringInDays?: number
  /** Default `createdAt` (when the garage registered). */
  sortBy?: GarageReportSortBy
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

export interface GarageReportData {
  garages: GarageReportRow[]
  pagination: Pagination
}

/**
 * Who a garage is, as the admin's job card endpoints return it beside the
 * cards — enough to title the screen reading them, and no password digest:
 * `users.passwordHash` is never selected on an admin route.
 */
export interface GarageIdentity {
  id: string
  ownerName: string
  mobileNumber: string
  garageName: string
  city: string | null
  email: string | null
}

/**
 * `GET /api/admin/garage/:garageId/jobcard` — one garage's job cards, read on
 * the admin token.
 *
 * `jobCards` and `pagination` are byte for byte what that garage's own
 * `GET /auth/jobcard` returns, so a row renders through the same helpers here
 * as it does on the owner's screens.
 */
export interface GarageJobCardsData {
  garage: GarageIdentity
  jobCards: JobCardRecord[]
  pagination: Pagination
}

/**
 * `GET /api/admin/dashboard/summary` — the count tiles of the admin dashboard.
 *
 * "Active" means a live subscription right now: stored `ACTIVE` **and** an end
 * date still ahead, so an expired or cancelled garage is left out.
 * `freeTrial + paidGarages = activeGarages` and
 * `activeGarages + expiredGarages = totalGarages`, always.
 */
export interface AdminDashboardSummary {
  /** Every registered garage, whatever its subscription says. */
  totalGarages: number
  /** Garages with a live subscription on any plan. */
  activeGarages: number
  /** Active garages on the free trial. */
  freeTrial: number
  /** Active garages on a monthly or yearly plan. */
  paidGarages: number
  /** Garages with no live subscription — run out or cancelled. */
  expiredGarages: number
  /** Active garages (any plan) that run out within 7 days. */
  expiringSoon: number
  /** Plan price × every MONTHLY subscription ever taken, in rupees. */
  monthlyRevenue: number
  /** Plan price × every YEARLY subscription ever taken, in rupees. */
  yearlyRevenue: number
}

/** One month of the admin growth chart. */
export interface AdminGrowthMonth {
  /** 1–12. */
  month: number
  /** `Jan` … `Dec`. */
  label: string
  /** Garages that registered that month. */
  newGarages: number
  /** Every garage registered by the end of that month. */
  totalGarages: number
  /** MONTHLY / YEARLY subscriptions bought that month, live or not. */
  newPaidSubscriptions: number
  /** Every paid subscription bought by the end of that month. */
  totalPaidSubscriptions: number
}

/**
 * `GET /api/admin/dashboard/growth?year=2026` — garages and paid subscriptions
 * month by month. Totals carry on from earlier years. The current year runs
 * January to the month running now; a past year is all twelve.
 */
export interface AdminGrowthChart {
  year: number
  /** The years the dropdown offers, newest first. */
  years: number[]
  months: AdminGrowthMonth[]
}

/** What the active garages report sorts on — the garage itself. */
export type ActiveGaragesSortBy = 'createdAt' | 'ownerName' | 'garageName' | 'city'

/** Query for `GET /api/admin/reports/active-garages`; all optional. */
export interface ActiveGaragesParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. */
  limit?: number
  /** Owner name, garage name, city, email or mobile number. */
  search?: string
  /**
   * The plan the garage is live on now. `FREE_TRIAL` means a live trial and no
   * live paid plan, so the three never overlap.
   */
  plan?: SubscriptionPlan
  /** Default `createdAt` (when the garage registered). */
  sortBy?: ActiveGaragesSortBy
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

/**
 * `GET /api/admin/reports/active-garages` — every garage live on a
 * subscription now, one row per garage with the plan it is on. With no search
 * or plan, `pagination.total` is the dashboard's Active tile.
 */
export interface ActiveGaragesReport {
  garages: GarageReportRow[]
  /** Platform wide; ignores `search` and `plan`. `activeGarages = paidGarages + freeTrial`. */
  counts: {
    activeGarages: number
    paidGarages: number
    freeTrial: number
  }
  pagination: Pagination
}
