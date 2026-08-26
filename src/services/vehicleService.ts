import { apiRequest } from './httpClient'
import type { CreateVehiclePayload, VehicleRecord } from '@/types/vehicle'

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

export const vehicleService = {
  createVehicle,
}
