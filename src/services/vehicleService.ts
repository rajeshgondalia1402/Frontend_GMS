import { apiRequest } from './httpClient'
import type {
  CreateVehiclePayload,
  VehicleListData,
  VehicleListParams,
  VehicleRecord,
} from '@/types/vehicle'

/** Builds the query tail; anything left unset falls back to the API default. */
function vehicleQuery(params: VehicleListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

/**
 * `POST /api/auth/vehicle` — protected. The `customerId` is verified against
 * the logged-in garage first, so a customer of another garage answers 404.
 *
 * The vehicle number is not unique: posting the same number again always
 * creates a new row, because a returning vehicle is a new visit.
 */
export function createVehicle(payload: CreateVehiclePayload): Promise<VehicleRecord> {
  return apiRequest<VehicleRecord>('/auth/vehicle', {
    method: 'POST',
    body: payload,
  })
}

/**
 * `GET /api/auth/vehicle` — a page of the vehicles belonging to this garage's
 * customers, each carrying a short `customer` object. Both the list and the
 * search box go through here: `search` matches the vehicle number, brand,
 * model, customer name or customer mobile number, and is left off to list
 * everything.
 *
 * Defaults: page 1, limit 10, newest first by `createdAt`.
 */
export function listVehicles(params: VehicleListParams = {}): Promise<VehicleListData> {
  return apiRequest<VehicleListData>(`/auth/vehicle${vehicleQuery(params)}`)
}

export const vehicleService = {
  createVehicle,
  listVehicles,
}
