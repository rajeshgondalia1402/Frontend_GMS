/** Types mirroring the Node.js API contract for `/api/auth/vehicle`. */

import type { Pagination } from './auth'

/** The API defaults a vehicle to `PENDING` when no status is sent. */
export type VehicleStatus = 'PENDING' | 'ACTIVE' | 'IN_SERVICE' | 'COMPLETED' | 'INACTIVE'

/**
 * `customerId` is checked against the logged-in garage before anything is
 * written — a customer of another garage answers 404.
 * Optional fields are omitted rather than sent empty.
 */
export interface CreateVehiclePayload {
  customerId: string
  /** Stored normalised: uppercased, spaces and hyphens removed. Not unique. */
  vehicleNumber: string
  vehicleType: string
  description: string
  currentKm: number
  brand?: string
  model?: string
  variant?: string
  fuelType?: string
  color?: string
  /** `YYYY-MM-DD`. */
  insuranceExpiry?: string
  status?: VehicleStatus
}

/**
 * `PUT /api/auth/vehicle/:id` — only the changed fields go out, and an empty
 * body is rejected with a 400. `customerId` and `garageId` are not accepted,
 * so a vehicle can never be moved to another customer or garage.
 */
export type UpdateVehiclePayload = Partial<Omit<CreateVehiclePayload, 'customerId'>>

/**
 * A vehicle as the API hands it back. Everything past the identifying three
 * is optional: `GET /auth/customer/:id` embeds a trimmed-down vehicle, while
 * a freshly created one comes back in full.
 */
export interface VehicleSummary {
  id: string
  vehicleNumber: string
  vehicleType: string
  description?: string | null
  currentKm?: number | null
  brand?: string | null
  model?: string | null
  variant?: string | null
  fuelType?: string | null
  color?: string | null
  insuranceExpiry?: string | null
  status?: VehicleStatus
  createdAt?: string
  updatedAt?: string
}

/** The vehicle row returned by a 201 on `POST /api/auth/vehicle`. */
export interface VehicleRecord extends VehicleSummary {
  customerId?: string
  garageId?: string
}

/** The trimmed customer object `GET /api/auth/vehicle` embeds in every row. */
export interface VehicleCustomer {
  id: string
  fullName: string
  mobileNumber: string
  whatsappNumber?: string
}

/** A listed vehicle: the full row plus the customer it belongs to. */
export interface VehicleWithCustomer extends VehicleRecord {
  customer?: VehicleCustomer
}

/** Query for `GET /api/auth/vehicle`; every field falls back to an API default. */
export interface VehicleListParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. No fixed maximum. */
  limit?: number
  /** Vehicle number, brand, model, customer name or customer mobile number. */
  search?: string
  status?: VehicleStatus
  /** Default `createdAt`. */
  sortBy?: 'createdAt' | 'updatedAt' | 'vehicleNumber' | 'status'
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

/** A page of this garage's vehicles. */
export interface VehicleListData {
  vehicles: VehicleWithCustomer[]
  pagination: Pagination
}
