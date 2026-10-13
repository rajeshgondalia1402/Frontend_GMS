/** Types mirroring the Node.js API contract for `/api/auth/car-selling`. */

import type { Pagination } from './auth'

/**
 * One used car on the garage's resale board, with `null` for anything left
 * blank. `garageId` is never returned — the caller always *is* that garage.
 */
export interface CarSellingRecord {
  id: string
  ownerName: string
  mobileNumber: string
  address: string | null
  yearOfVehicle: number | null
  carType: string | null
  companyName: string | null
  /** Stored normalised — uppercase, no spaces or hyphens — or `null` when blank. */
  carNumber: string | null
  /** The number of previous owners, 1 to 20. */
  carOwner: number | null
  carColor: string | null
  /** One of `FUEL_TYPES` — required when a car is added. */
  fuelType: string
  insurance: boolean
  /**
   * The date the insurance is valid until, returned at midnight UTC
   * (`2027-05-20T00:00:00.000Z`) — only the date part means anything.
   */
  insuranceDate: string | null
  puc: boolean
  /** A plain JSON number, or `null` while no price has been agreed. */
  sellingPrice: number | null
  isAccidental: boolean
  /** Whatever the garage wrote about the car, or `null` when left blank. */
  description: string | null
  createdAt?: string
  updatedAt?: string
}

/**
 * `POST /api/auth/car-selling`. The owner's name, mobile number, car number,
 * fuel type and selling price are required; the flags left out are stored as
 * `false`.
 * `garageId` is never sent — the API takes it from the bearer token.
 */
export interface CreateCarSellingPayload {
  ownerName: string
  mobileNumber: string
  address?: string
  yearOfVehicle?: number
  carType?: string
  companyName?: string
  /** Normalised — uppercase, no spaces or hyphens. */
  carNumber: string
  carOwner?: number
  carColor?: string
  fuelType: string
  insurance?: boolean
  /** `YYYY-MM-DD`. */
  insuranceDate?: string
  puc?: boolean
  sellingPrice: number
  isAccidental?: boolean
  description?: string
}

/**
 * `PUT /api/auth/car-selling/:id`. Only the fields that changed — a flag that
 * is not sent is left exactly as it was, and an empty body is rejected with
 * "Send at least one field to update."
 */
export interface UpdateCarSellingPayload {
  ownerName?: string
  mobileNumber?: string
  /** `''` is stored as `null`. */
  address?: string
  /** `''` is stored as `null`. */
  yearOfVehicle?: number | ''
  carType?: string
  companyName?: string
  /** Can be changed, never cleared — the form always sends one. */
  carNumber?: string
  carOwner?: number | null
  /** `''` is stored as `null`. */
  carColor?: string
  /** Can be changed, never cleared — the form always sends one. */
  fuelType?: string
  insurance?: boolean
  /** `YYYY-MM-DD`, or `null` to clear it. */
  insuranceDate?: string | null
  puc?: boolean
  /** Can be changed, never cleared. */
  sellingPrice?: number
  isAccidental?: boolean
  /** `''` is stored as `null`. */
  description?: string
}

export type CarSellingSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'ownerName'
  | 'carNumber'
  | 'companyName'
  | 'carType'
  | 'yearOfVehicle'
  | 'sellingPrice'
  | 'insuranceDate'

/** Query for `GET /api/auth/car-selling`; every field falls back to an API default. */
export interface CarSellingListParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. No fixed maximum. */
  limit?: number
  /** Owner name, company, car type, address, mobile number and year at once. */
  search?: string
  /** Default `createdAt`. Empty columns sort last in both directions. */
  sortBy?: CarSellingSortField
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

/** A page of the garage's board. Soft deleted cars never appear. */
export interface CarSellingListData {
  carSellings: CarSellingRecord[]
  pagination: Pagination
}

/** What `DELETE /api/auth/car-selling/:id` answers with. */
export interface DeletedCarSelling {
  id: string
  ownerName: string
  isDelete: boolean
  deletedAt: string
}
