import { apiRequest } from './httpClient'
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleListData,
  VehicleListParams,
  VehicleRecord,
  VehicleWithCustomer,
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

/**
 * `PUT /api/auth/vehicle/:id` — send only what changed. Updatable:
 * `vehicleNumber`, `vehicleType`, `brand`, `model`, `variant`, `fuelType`,
 * `description`, `status`, `currentKm`, `color` and `insuranceExpiry`.
 *
 * `customerId` is deliberately not accepted — moving a vehicle to another
 * customer is a business decision, not a field edit — so a body carrying only
 * that is rejected with "Send at least one field to update."
 */
export function updateVehicle(
  id: string,
  payload: UpdateVehiclePayload,
): Promise<VehicleRecord> {
  return apiRequest<VehicleRecord>(`/auth/vehicle/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/** One request per page while collecting a customer's whole fleet. */
const ALL_VEHICLES_PAGE_SIZE = 100

/**
 * Every vehicle matching `params`, not just the first page — the job card
 * needs all of a customer's vehicles at once.
 *
 * The API pages whatever it is asked for, so this follows `hasNextPage` rather
 * than trusting one oversized `limit`. The page cap is a stop against a server
 * that always answers `hasNextPage: true`.
 */
export async function listAllVehicles(
  params: Omit<VehicleListParams, 'page' | 'limit'> = {},
): Promise<VehicleWithCustomer[]> {
  const MAX_PAGES = 50
  const rows: VehicleWithCustomer[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await listVehicles({ ...params, page, limit: ALL_VEHICLES_PAGE_SIZE })
    rows.push(...data.vehicles)
    if (!data.pagination?.hasNextPage) break
  }

  return rows
}

export const vehicleService = {
  createVehicle,
  updateVehicle,
  listVehicles,
  listAllVehicles,
}
