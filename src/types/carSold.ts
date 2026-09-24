/** Types mirroring the Node.js API contract for selling a listed car on. */

import type { Pagination } from './auth'

/**
 * Where the money on a sale stands, worked out by the API from the sale's live
 * payments against `finalSellingPrice`.
 *
 * Only two values, unlike a job card: what matters at the counter is whether
 * the car is paid off or still owing, so "nothing paid yet" is the far end of
 * `PARTIAL` rather than an `UNPAID` of its own — `paidAmount` is the honest
 * number next to it.
 */
export type CarSoldPaymentStatus = 'PARTIAL' | 'PAID'

/** Whether the buyer has actually driven the car away. */
export type CarSoldDeliveredStatus = 'DELIVERED' | 'PENDING'

/**
 * One row of `GET /api/auth/car-selling/dropdown` — every car this garage
 * still has for sale, as the three fields a picker needs. `carType` is `null`
 * when no body type was recorded.
 */
export interface CarSellingOption {
  id: string
  carNumber: string
  carType: string | null
}

/** One receipt against a sale. A cancelled one is never returned. */
export interface CarSoldPayment {
  id: string
  paymentAmount: number
  createdDate: string
  createdAt?: string
}

/**
 * A sale: who bought a listed car, what the deal was and what has been paid.
 *
 * `paymentStatus`, `paidAmount` and `remainingAmount` are the API's: the two
 * amounts are derived from `payments` rather than stored, and `remainingAmount`
 * never goes below 0.
 */
export interface CarSoldCustomerRecord {
  id: string
  /** The listing this sale belongs to. */
  carSellingId: string
  /** What the car actually went for — not the listing's asking price. */
  finalSellingPrice: number
  purchaseOwnerName: string
  purchaseOwnerMobileNo: string
  purchaseOwnerAddress: string | null
  paymentStatus: CarSoldPaymentStatus
  deliveredStatus: CarSoldDeliveredStatus
  /** Midnight UTC on the day it was handed over, or `null` while pending. */
  deliveredDate: string | null
  paidAmount: number
  remainingAmount: number
  payments: CarSoldPayment[]
  createdAt?: string
  updatedAt?: string
}

/**
 * One row of `GET /api/auth/car-selling/sold`: the listing, with fewer of its
 * columns than the single-car endpoint returns — this screen is about the deal
 * — and the sale hanging off it.
 */
export interface SoldCarRecord {
  id: string
  ownerName: string
  mobileNumber: string
  carNumber: string | null
  carType: string | null
  companyName: string | null
  yearOfVehicle: number | null
  /** The asking price the car was listed at. */
  sellingPrice: number | null
  status: 'SOLD'
  createdAt?: string
  updatedAt?: string
  /**
   * `null` when the garage marked the car SOLD by hand without recording a
   * buyer. Those cars still belong on this screen — "sold, no buyer recorded"
   * — rather than being filtered out.
   */
  soldCustomerDetail: CarSoldCustomerRecord | null
}

export type SoldCarSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'carNumber'
  | 'ownerName'
  | 'sellingPrice'

/**
 * Query for `GET /api/auth/car-selling/sold`; every field falls back to an API
 * default. Nothing on the sale record can be sorted by — it is allowed to be
 * null, so those rows would land in an arbitrary place.
 */
export interface SoldCarListParams {
  /** 1-based. Default `1`. */
  page?: number
  /** Default `10`. No fixed maximum. */
  limit?: number
  /** Car number, seller name, buyer name, company, car type, either mobile number. */
  search?: string
  /** Default `createdAt`. */
  sortBy?: SoldCarSortField
  /** Default `desc`. */
  sortOrder?: 'asc' | 'desc'
}

/** A page of the sold half of the board. */
export interface SoldCarListData {
  soldCars: SoldCarRecord[]
  pagination: Pagination
}

/**
 * `POST /api/auth/car-selling/:id/sold-customer`. The listing is the `:id` in
 * the URL and the garage comes from the token, so neither `carSellingId` nor
 * `garageId` is sent. `paymentStatus` is never sent either — the API derives it
 * from the payments.
 */
export interface CreateCarSoldCustomerPayload {
  finalSellingPrice: number
  purchaseOwnerName: string
  purchaseOwnerMobileNo: string
  purchaseOwnerAddress?: string
  /** Left out, the API stores `PENDING`. */
  deliveredStatus?: CarSoldDeliveredStatus
  /** `YYYY-MM-DD`, only alongside `DELIVERED` or a payment covering the price. */
  deliveredDate?: string
  /**
   * The money taken at the counter, written as the sale's first receipt.
   * Optional, more than 0, and at most `finalSellingPrice`.
   */
  paymentAmount?: number
}

/**
 * `POST /api/auth/car-selling/sold-customer/:id` — corrects a recorded sale.
 * Partial, but never empty. No money moves here: there is no `paymentAmount`,
 * and `finalSellingPrice` may not drop below what has already been paid.
 */
export interface UpdateCarSoldCustomerPayload {
  finalSellingPrice?: number
  purchaseOwnerName?: string
  purchaseOwnerMobileNo?: string
  /** `''` clears it. */
  purchaseOwnerAddress?: string
  deliveredStatus?: CarSoldDeliveredStatus
  /** `YYYY-MM-DD`, only alongside `DELIVERED`. */
  deliveredDate?: string
}

/** `POST /api/auth/car-selling/sold-customer/:id/payment` — one receipt. */
export interface CreateCarSoldPaymentPayload {
  /** More than 0, and at most what is still owing on the sale. */
  paymentAmount: number
}

/**
 * What a write against a sale answers with — recording it, or collecting money
 * against it. The sale comes back in the same shape the sold list returns, so a
 * row can be replaced where it stands, and `carSelling` says what the listing
 * now reads: a car paid off, or handed over, is off the selling board.
 */
export interface CarSaleResult {
  carSoldCustomer: CarSoldCustomerRecord
  carSelling: {
    id: string
    ownerName: string
    carNumber: string
    status: 'SALE' | 'SOLD'
  }
}
