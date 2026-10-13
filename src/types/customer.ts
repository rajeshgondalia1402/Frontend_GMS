/** Types mirroring the Node.js API contract for `/api/auth/customer`. */

import type { Pagination } from './auth'
import type { VehicleSummary } from './vehicle'

/**
 * `POST /api/auth/customer`.
 * `garageId` is never sent — the API always takes it from the bearer token.
 * Optional fields may be sent as `""`; the API stores those as `null`.
 */
export interface CreateCustomerPayload {
  fullName: string
  mobileNumber: string
  whatsappNumber: string
  email: string
  address: string
  city: string
  notes: string
}

/**
 * `PUT /api/auth/customer/:id` — only the changed fields go out, and an empty
 * body is rejected with a 400. `id` and `garageId` are not accepted, so a
 * customer can never be moved to another garage.
 */
export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

/** The customer row returned by the API, with `null` for anything left blank. */
export interface CustomerRecord {
  id: string
  garageId?: string
  fullName: string
  mobileNumber: string
  whatsappNumber: string
  email: string | null
  address: string | null
  city: string | null
  notes: string | null
  createdAt?: string
  updatedAt?: string
}

/** `GET /api/auth/customer/:id` — the customer plus all of their vehicles. */
export interface CustomerWithVehicles extends CustomerRecord {
  vehicles: VehicleSummary[]
}

/** Query for `GET /api/auth/customer`; every field falls back to an API default. */
export interface CustomerListParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `20`, max `100`. */
  limit?: number
  /** Customer name, mobile number or WhatsApp number. Omitted lists everyone. */
  search?: string
  /** Default `createdAt`. */
  sortBy?: 'createdAt' | 'updatedAt' | 'fullName' | 'city'
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

/** A page of customers, each with all of their vehicles. */
export interface CustomerListData {
  customers: CustomerWithVehicles[]
  pagination: Pagination
}
