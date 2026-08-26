import { apiRequest } from './httpClient'
import type {
  CreateCustomerPayload,
  CustomerListData,
  CustomerListParams,
  CustomerRecord,
  CustomerWithVehicles,
  UpdateCustomerPayload,
} from '@/types/customer'

/** Builds the query tail; anything left unset falls back to the API default. */
function customerQuery(params: CustomerListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

/**
 * `POST /api/auth/customer` — protected; the garage comes from the token, so
 * `garageId` is never part of the payload.
 * Rejects with 409 when the mobile number already belongs to a customer of
 * this garage. Use the returned `id` as `customerId` to add a vehicle.
 */
export function createCustomer(payload: CreateCustomerPayload): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>('/auth/customer', {
    method: 'POST',
    body: payload,
  })
}

/**
 * `GET /api/auth/customer` — a page of this garage's customers, each with all
 * of their vehicles (`[]` when they have none). Both the list and the search
 * box go through here: `search` matches the customer name, mobile number or
 * WhatsApp number, and is simply left off to list everyone.
 *
 * Defaults: page 1, limit 20 (max 100), newest first by `createdAt`.
 */
export function listCustomers(params: CustomerListParams = {}): Promise<CustomerListData> {
  return apiRequest<CustomerListData>(`/auth/customer${customerQuery(params)}`)
}

/**
 * `GET /api/auth/customer/:id` — the customer plus every vehicle of theirs.
 * Scoped to the garage on the token, so another garage's customer is a 404.
 */
export function getCustomer(id: string): Promise<CustomerWithVehicles> {
  return apiRequest<CustomerWithVehicles>(`/auth/customer/${encodeURIComponent(id)}`)
}

/**
 * `PUT /api/auth/customer/:id` — send only what changed; an empty body is a
 * 400. Moving the mobile number onto one another customer of this garage
 * already holds is a 409.
 */
export function updateCustomer(
  id: string,
  payload: UpdateCustomerPayload,
): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(`/auth/customer/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

export const customerService = {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
}
