import { apiRequest } from './httpClient'
import type {
  CreateStaffPayload,
  StaffListData,
  StaffListParams,
  StaffRecord,
  UpdateStaffPayload,
} from '@/types/staff'

/** Builds the query tail; anything left unset falls back to the API default. */
function staffQuery(params: StaffListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

/**
 * `POST /api/auth/staff` — protected; the garage comes from the token.
 *
 * `status` is not accepted: someone who has just been added is always working
 * at the garage, so the API sets `ACTIVE` itself.
 *
 * A mobile number may appear only once inside one garage — a number another
 * active staff member holds answers 409, while a number a soft deleted staff
 * member still holds revives that row with the new details.
 */
export function createStaff(payload: CreateStaffPayload): Promise<StaffRecord> {
  return apiRequest<StaffRecord>('/auth/staff', {
    method: 'POST',
    body: payload,
  })
}

/**
 * `PUT /api/auth/staff/:id` — protected. Changes `name`, `category`, `role`,
 * `mobileNumber`, `monthlySalary` and `status`; an empty body is rejected.
 *
 * Unlike on create, `status` is accepted: this is where someone who has
 * stopped working is switched off. Switching them to `INACTIVE` does not hide
 * them — they keep appearing in the list, badged, until they are deleted.
 *
 * Renaming onto a mobile number another active staff member of this garage
 * holds answers 409.
 */
export function updateStaff(id: string, payload: UpdateStaffPayload): Promise<StaffRecord> {
  return apiRequest<StaffRecord>(`/auth/staff/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/**
 * `GET /api/auth/staff` — a page of this garage's staff. Both the list and the
 * search box go through here: `search` matches the name, role, category and
 * mobile number at once, and is simply left off to list everyone.
 *
 * Leaving `status` off returns the active and the inactive staff together, so
 * the garage sees everyone on its books and the inactive ones are badged here.
 * Soft deleted staff are filtered out of every query.
 *
 * Defaults: page 1, limit 10, newest first by `createdAt`.
 */
export function listStaff(params: StaffListParams = {}): Promise<StaffListData> {
  return apiRequest<StaffListData>(`/auth/staff${staffQuery(params)}`)
}

/** One request per page while collecting the whole book. */
const ALL_STAFF_PAGE_SIZE = 100

/**
 * Every staff member of the garage, not just the first page — the job card's
 * "Assigned Staff" list has to hold all of them.
 *
 * The API pages whatever it is asked for, so this follows `hasNextPage` rather
 * than trusting one oversized `limit` to cover a garage of any size. The page
 * cap is a stop against a server that always answers `hasNextPage: true`.
 */
export async function listAllStaff(
  params: Omit<StaffListParams, 'page' | 'limit'> = {},
): Promise<StaffRecord[]> {
  const MAX_PAGES = 50
  const rows: StaffRecord[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await listStaff({ ...params, page, limit: ALL_STAFF_PAGE_SIZE })
    rows.push(...data.staff)
    if (!data.pagination?.hasNextPage) break
  }

  return rows
}

export const staffService = {
  createStaff,
  updateStaff,
  listStaff,
  listAllStaff,
}
