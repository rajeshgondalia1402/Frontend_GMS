/** Types mirroring the Node.js API contract for `/api/admin/subscription-plan`. */

import type { Pagination } from './auth'

/** One subscription plan as the admin API returns it. */
export interface PlanRecord {
  /** An integer, not a UUID: the plans table keys on 1, 2, 3, … */
  planId: number
  /** Stored in code form — `FREE_TRIAL`, `MONTHLY`, `HALF_YEARLY`. */
  name: string
  price: number
  /** How long one purchase runs. */
  durationDays: number
  /** Offered to new garages. Inactive plans keep every subscription already taken. */
  isActive: boolean
  deactivatedAt: string | null
  /** FREE_TRIAL / MONTHLY / YEARLY — cannot be renamed or deactivated. */
  isSystemPlan: boolean
  /** Times the plan has been taken, live or not. */
  subscriptionCount: number
  createdAt: string
  updatedAt: string
}

export type PlanStatusFilter = 'all' | 'active' | 'inactive'

export interface PlanListParams {
  page?: number
  limit?: number
  /** Partial match on the plan name. */
  search?: string
  /** Default `all`. */
  status?: PlanStatusFilter
  sortBy?: 'planId' | 'name' | 'price' | 'durationDays' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PlanListData {
  plans: PlanRecord[]
  /** Over every plan; ignores `search` and `status`. `all = active + inactive`. */
  counts: { all: number; active: number; inactive: number }
  pagination: Pagination
}

/**
 * `POST` takes all three; `PUT` any of them. The name may be typed in words —
 * "Half Yearly" is saved as `HALF_YEARLY`.
 */
export interface PlanPayload {
  name: string
  price: number
  durationDays: number
}
