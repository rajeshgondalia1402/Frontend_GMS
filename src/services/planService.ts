import { apiRequest } from './httpClient'
import type { PlanListData, PlanListParams, PlanPayload, PlanRecord } from '@/types/plan'

const BASE = '/admin/subscription-plan'

/**
 * `GET /api/admin/subscription-plan` — every plan, active and inactive by
 * default, with `counts` for the status filter. Admin token only.
 */
export function listPlans(params: PlanListParams = {}): Promise<PlanListData> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return apiRequest<PlanListData>(`${BASE}${tail ? `?${tail}` : ''}`, { authScope: 'admin' })
}

/** `GET /api/admin/subscription-plan/:id` — one plan, active or not. */
export function getPlan(planId: number): Promise<PlanRecord> {
  return apiRequest<PlanRecord>(`${BASE}/${planId}`, { authScope: 'admin' })
}

/**
 * `POST /api/admin/subscription-plan` — a new plan. A name held by an inactive
 * plan reactivates that plan with the new price and duration instead.
 */
export function createPlan(payload: PlanPayload): Promise<PlanRecord> {
  return apiRequest<PlanRecord>(BASE, { method: 'POST', body: payload, authScope: 'admin' })
}

/**
 * `PUT /api/admin/subscription-plan/:id` — partial. System plans keep their
 * name, and FREE_TRIAL stays at price 0; the API answers 400 otherwise.
 */
export function updatePlan(planId: number, payload: Partial<PlanPayload>): Promise<PlanRecord> {
  return apiRequest<PlanRecord>(`${BASE}/${planId}`, {
    method: 'PUT',
    body: payload,
    authScope: 'admin',
  })
}

/**
 * `PATCH /api/admin/subscription-plan/:id/status` — switch a plan on or off for
 * new garages. Off keeps every subscription already taken on it; system plans
 * cannot be switched off.
 */
export function setPlanStatus(planId: number, isActive: boolean): Promise<PlanRecord> {
  return apiRequest<PlanRecord>(`${BASE}/${planId}/status`, {
    method: 'PATCH',
    body: { isActive },
    authScope: 'admin',
  })
}

export const planService = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  setPlanStatus,
}
