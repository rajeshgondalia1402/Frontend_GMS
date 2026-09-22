import { apiRequest } from './httpClient'
import { jobCardQuery } from './jobCardService'
import type { JobCardListParams, JobCardRecord } from '@/types/jobCard'
import type {
  AdminChangePasswordData,
  AdminChangePasswordPayload,
  AdminLoginData,
  AdminLoginPayload,
  GarageJobCardsData,
  GarageReportData,
  GarageReportParams,
} from '@/types/admin'

/**
 * `POST /api/admin/login` — the platform admin, not a garage owner. Returns a
 * token of its own, which every other admin endpoint expects.
 *
 * A wrong number and a wrong password answer the same deliberately vague 401,
 * so the API cannot be used to find out which numbers are admin accounts.
 */
export function login(payload: AdminLoginPayload): Promise<AdminLoginData> {
  return apiRequest<AdminLoginData>('/admin/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

/**
 * `POST /api/admin/change-password` — protected by the **admin** token, which
 * is also where the admin id comes from; it is never part of the body.
 * A garage owner's token answers 403 here.
 */
export function changePassword(
  payload: AdminChangePasswordPayload,
): Promise<AdminChangePasswordData> {
  return apiRequest<AdminChangePasswordData>('/admin/change-password', {
    method: 'POST',
    body: payload,
    authScope: 'admin',
    // 401 here means the current password was wrong, not that the token died.
    signOutOn401: false,
  })
}

/** Builds the query tail; anything left unset falls back to the API default. */
function garageReportQuery(params: GarageReportParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.plan) query.set('plan', params.plan)
  if (params.status) query.set('status', params.status)
  if (params.expired !== undefined) query.set('expired', String(params.expired))
  if (params.expiringInDays !== undefined) {
    query.set('expiringInDays', String(params.expiringInDays))
  }
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

/**
 * `GET /api/admin/report/garages` — every garage in the system with its
 * subscription: the plan, when it started, when it runs out and the days left.
 *
 * The only endpoint that reads across garages, so it goes out on the **admin**
 * token; a garage owner's token answers 403.
 *
 * Defaults: page 1, limit 10, newest registration first.
 */
export function listGarageReport(params: GarageReportParams = {}): Promise<GarageReportData> {
  return apiRequest<GarageReportData>(`/admin/report/garages${garageReportQuery(params)}`, {
    authScope: 'admin',
  })
}

/**
 * `GET /api/admin/garage/:garageId/jobcard` — a page of one garage's job cards,
 * each carrying the vehicle it is for (with that vehicle's customer), the staff
 * member on it and every live billable line, so a row renders in full with no
 * call per card. The garage itself comes back beside them.
 *
 * Under `/api/admin` rather than `/auth/jobcard` because the garage is named by
 * the caller: every route under `/api/auth` is pinned to the garage in its
 * token, and an admin token belongs to no garage. The rows are the garage's own
 * all the same — the API reads them through the same list it serves the owner.
 */
export function listGarageJobCards(
  garageId: string,
  params: JobCardListParams = {},
): Promise<GarageJobCardsData> {
  return apiRequest<GarageJobCardsData>(
    `/admin/garage/${encodeURIComponent(garageId)}/jobcard${jobCardQuery(params)}`,
    { authScope: 'admin' },
  )
}

/**
 * `GET /api/admin/garage/:garageId/jobcard/:id` — one card of that garage in
 * full: the vehicle it is for (with that vehicle's customer), the staff member
 * on it and every live billable line.
 *
 * The object is exactly the shape a row of the list has, so a screen that opens
 * a card from the list renders the same data either way and nothing is mapped
 * twice — the row paints the detail while this confirms it.
 *
 * The garage is part of the lookup and not just part of the address: a card id
 * belonging to another garage answers 404 rather than that garage's card.
 */
export function getGarageJobCard(garageId: string, id: string): Promise<JobCardRecord> {
  return apiRequest<JobCardRecord>(
    `/admin/garage/${encodeURIComponent(garageId)}/jobcard/${encodeURIComponent(id)}`,
    { authScope: 'admin' },
  )
}

export const adminService = {
  login,
  changePassword,
  listGarageReport,
  listGarageJobCards,
  getGarageJobCard,
}
