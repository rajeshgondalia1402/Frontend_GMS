/** Types mirroring the Node.js API contract for `/api/auth/jobcard`. */

import type { Pagination } from './auth'
import type { VehicleWithCustomer } from './vehicle'

/** One billable line as it is posted — the API works the totals out itself. */
export interface CreateJobItemPayload {
  description: string
  qty: number
  rate: number
}

/**
 * `POST /api/auth/jobcard`.
 *
 * `garageId`, each line's `total` and the card's `totalAmount` are the API's
 * to set and are dropped if sent, so a card can never bill a figure its own
 * lines do not add up to.
 *
 * `currentKm` and `description` are not job card fields at all: they describe
 * the vehicle — what the odometer reads today and what is wrong with it — and
 * are written onto the vehicle named by `vehicleId`.
 */
export interface CreateJobCardPayload {
  /** A live vehicle of this garage. */
  vehicleId: string
  /** Free within this garage; taken from `GET /auth/jobcard/job-number`. */
  jobNumber: string
  /** Date or timestamp. Left out, the API stamps it now. */
  serviceDate?: string
  /** A live staff member of this garage, or `null` for nobody yet. */
  assignedStaffId?: string | null
  /** The reading today, written onto the vehicle. Left out when not taken. */
  currentKm?: number
  description: string
  /** Omitted entirely for a card with nothing billed on it yet. */
  items?: CreateJobItemPayload[]
}

/** One line on an edit: a line already on the card carries its id, a new one does not. */
export interface UpdateJobItemPayload extends CreateJobItemPayload {
  /** Left out for a line being added to the card. */
  id?: string
}

/**
 * `PUT /api/auth/jobcard/:id` — the card and its billable lines in one call
 * and one transaction, so the lines can never end up saved against a
 * `totalAmount` that no longer adds up to them.
 *
 * The vehicle, the job number and the service date are not editable here: a
 * card belongs to the vehicle it was opened against.
 */
export interface UpdateJobCardPayload {
  status?: JobCardStatus
  /** A live staff member of this garage, or `null` for nobody. */
  assignedStaffId?: string | null
  currentKm?: number
  description?: string
  /** Every line the card should end up with — one left out is dropped. */
  items?: UpdateJobItemPayload[]
}

/** A billed line as the API hands it back, with the total it worked out. */
export interface JobItemRecord extends CreateJobItemPayload {
  id: string
  total: number
}

/**
 * The API's own vocabulary — `SERVICE_JOB_STATUSES` in the backend's
 * `src/constants.js`. Two states and no third: a card is either still work in
 * hand, or the vehicle has gone back out. Anything else is rejected by
 * `PUT /auth/jobcard/:id` with a 400, so nothing else may be sent.
 */
export type JobCardStatus = 'PENDING' | 'DELIVERED'

/** Where the bill is, as opposed to where the vehicle is. The API owns it. */
export type JobPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

/** The staff member a card is handed to, as embedded in the card. */
export interface JobCardStaff {
  id: string
  name: string
  category: string
  role: string | null
}

/** `POST /api/auth/jobcard` — the created card, with what it was built from. */
export interface JobCardRecord {
  id: string
  garageId: string
  vehicleId: string
  jobNumber: string
  serviceDate: string
  /** Always `PENDING` on a new card — the API does not take one on create. */
  status: JobCardStatus
  /** `UNPAID` until payments are recorded against the card. */
  paymentStatus: JobPaymentStatus
  assignedStaffId: string | null
  /** The sum of the line totals, each rounded to 2 decimals before summing. */
  totalAmount: number
  completionDate: string | null
  assignedStaff?: JobCardStaff | null
  /** Carried back because `currentKm` and `description` were written onto it. */
  vehicle?: VehicleWithCustomer
  items: JobItemRecord[]
}

/** Query for `GET /api/auth/jobcard`; every field falls back to an API default. */
export interface JobCardListParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. Ask for more rows than exist and you get all of them. */
  limit?: number
  /**
   * One box over three things at once: the customer's name, the vehicle number
   * (normalised, so `gj 01-ab` finds `GJ01AB1234`) and the vehicle type.
   */
  search?: string
  /** Default `createdAt`. */
  sortBy?: 'createdAt' | 'updatedAt' | 'serviceDate' | 'jobNumber' | 'totalAmount' | 'status'
  /** Default `desc` — newest first, the order a garage works in. */
  sortOrder?: 'asc' | 'desc'
}

/** A page of this garage's job cards, each with its vehicle and its lines. */
export interface JobCardListData {
  jobCards: JobCardRecord[]
  pagination: Pagination
}
