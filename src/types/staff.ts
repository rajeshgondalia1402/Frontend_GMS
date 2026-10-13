/** Types mirroring the Node.js API contract for `/api/auth/staff`. */

import type { Pagination } from './auth'

/**
 * The dropdown values. The API stores the category uppercased with spaces and
 * hyphens turned into underscores, so `"Service Advisor"`, `"service-advisor"`
 * and `"SERVICE_ADVISOR"` all land on the same row — we always send the stored
 * form. Anything outside these four is a 400.
 */
export type StaffCategory = 'MECHANIC' | 'SERVICE_ADVISOR' | 'HELPER' | 'OTHER'

/**
 * Set by the API, never by us: someone who has just been added is always
 * working at the garage, so a new staff member comes back `ACTIVE`.
 * Switching someone off is `PUT /api/auth/staff/:id`.
 */
export type StaffStatus = 'ACTIVE' | 'INACTIVE'

/**
 * `POST /api/auth/staff`.
 * `garageId` is never sent — the API always takes it from the bearer token,
 * and a `status` key would simply be dropped.
 */
export interface CreateStaffPayload {
  name: string
  category: StaffCategory
  mobileNumber: string
  /** The free text job title printed on the card. `''` is stored as `null`. */
  role?: string
  /** Left out entirely while the pay has not been agreed yet. */
  monthlySalary?: number
}

/**
 * `PUT /api/auth/staff/:id`. Every field is optional — the API rejects an
 * empty body with "Send at least one field to update."
 *
 * `status` is accepted here, unlike on create: this is where someone who has
 * stopped working is switched off. `uid` is never accepted, so a staff member
 * can not be moved to another garage.
 */
export interface UpdateStaffPayload {
  name?: string
  category?: StaffCategory
  mobileNumber?: string
  /** `''` is stored as `null`, which clears the job title. */
  role?: string
  monthlySalary?: number
  status?: StaffStatus
}

/** The staff row returned by the API, with `null` for anything left blank. */
export interface StaffRecord {
  id: string
  garageId?: string
  name: string
  category: StaffCategory
  role: string | null
  mobileNumber: string
  monthlySalary: number | null
  status: StaffStatus
  createdAt?: string
  updatedAt?: string
}

/** Query for `GET /api/auth/staff`; every field falls back to an API default. */
export interface StaffListParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. No fixed maximum — ask for more than exist and you get them all. */
  limit?: number
  /** Matches the name, role, category or mobile number at once. */
  search?: string
  /** Exact filter, combinable with `search`. */
  category?: StaffCategory
  /** Exact filter. **Left out, the list returns `ACTIVE` and `INACTIVE` together.** */
  status?: StaffStatus
  /** Default `createdAt`. */
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'category' | 'monthlySalary' | 'status'
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

/** A page of this garage's staff. Soft deleted rows are never included. */
export interface StaffListData {
  staff: StaffRecord[]
  pagination: Pagination
}
