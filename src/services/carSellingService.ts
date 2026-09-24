import { apiRequest } from './httpClient'
import type {
  CarSellingListData,
  CarSellingListParams,
  CarSellingRecord,
  CreateCarSellingPayload,
  DeletedCarSelling,
  UpdateCarSellingPayload,
} from '@/types/carSelling'
import type { CarSellingOption } from '@/types/carSold'

/** Builds the query tail; anything left unset falls back to the API default. */
function carSellingQuery(params: CarSellingListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

const carPath = (id: string) => `/auth/car-selling/${encodeURIComponent(id)}`

/**
 * `GET /api/auth/car-selling` — a page of the garage's used cars for sale.
 * `search` matches the owner name, company, car type, address, mobile number
 * and year at once, and is simply left off to list everything.
 *
 * Defaults: page 1, limit 10, newest first by `createdAt`.
 */
export function listCarSellings(params: CarSellingListParams = {}): Promise<CarSellingListData> {
  return apiRequest<CarSellingListData>(`/auth/car-selling${carSellingQuery(params)}`)
}

/**
 * `GET /api/auth/car-selling/dropdown` — every car still FOR SALE, as just the
 * id, number and body type. Takes no query string and is not paged: the whole
 * set comes back in one call so a picker can filter it as the user types. A
 * garage with nothing for sale gets `[]`.
 */
export function listCarSellingOptions(): Promise<CarSellingOption[]> {
  return apiRequest<CarSellingOption[]>('/auth/car-selling/dropdown')
}

/** `GET /api/auth/car-selling/:id` — 404 for a deleted car or another garage's. */
export function getCarSelling(id: string): Promise<CarSellingRecord> {
  return apiRequest<CarSellingRecord>(carPath(id))
}

/**
 * `POST /api/auth/car-selling` — the garage comes from the token. The same
 * mobile number may be posted again: one person with two cars gets two
 * listings, so there is no 409 here.
 */
export function createCarSelling(payload: CreateCarSellingPayload): Promise<CarSellingRecord> {
  return apiRequest<CarSellingRecord>('/auth/car-selling', { method: 'POST', body: payload })
}

/** `PUT /api/auth/car-selling/:id` — only the fields that changed. */
export function updateCarSelling(
  id: string,
  payload: UpdateCarSellingPayload,
): Promise<CarSellingRecord> {
  return apiRequest<CarSellingRecord>(carPath(id), { method: 'PUT', body: payload })
}

/** `DELETE /api/auth/car-selling/:id` — a soft delete, like every other table. */
export function deleteCarSelling(id: string): Promise<DeletedCarSelling> {
  return apiRequest<DeletedCarSelling>(carPath(id), { method: 'DELETE' })
}

export const carSellingService = {
  listCarSellings,
  listCarSellingOptions,
  getCarSelling,
  createCarSelling,
  updateCarSelling,
  deleteCarSelling,
}
