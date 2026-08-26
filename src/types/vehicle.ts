/** Types mirroring the Node.js API contract for `POST /api/auth/vehicle`. */

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
