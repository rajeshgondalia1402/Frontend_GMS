import { apiRequest } from './httpClient'
import type {
  CarSaleResult,
  CreateCarSoldCustomerPayload,
  CreateCarSoldPaymentPayload,
  SoldCarListData,
  SoldCarListParams,
  SoldCarRecord,
  UpdateCarSoldCustomerPayload,
} from '@/types/carSold'

/** Builds the query tail; anything left unset falls back to the API default. */
function soldCarQuery(params: SoldCarListParams): string {
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
 * `GET /api/auth/car-selling/sold` — the sold half of the board, each car with
 * its sale and that sale's live payments. The exact complement of
 * `GET /api/auth/car-selling`, which returns the cars still for sale.
 *
 * `search` matches the car number, the seller's name, the buyer's name, the
 * company, the car type and either mobile number at once.
 *
 * Defaults: page 1, limit 10, newest first by `createdAt`.
 */
export function listSoldCars(params: SoldCarListParams = {}): Promise<SoldCarListData> {
  return apiRequest<SoldCarListData>(`/auth/car-selling/sold${soldCarQuery(params)}`)
}

/**
 * `GET /api/auth/car-selling/sold-customer/:id` — one sale by its own id,
 * returned as its car in the same shape as a row of the sold list.
 */
export async function getSoldCar(carSoldCustomerId: string): Promise<SoldCarRecord> {
  const data = await apiRequest<{ soldCar: SoldCarRecord }>(
    `/auth/car-selling/sold-customer/${encodeURIComponent(carSoldCustomerId)}`,
  )
  return data.soldCar
}

/**
 * `POST /api/auth/car-selling/:id/sold-customer` — sells the listed car on.
 *
 * `paymentAmount` is optional and becomes the sale's first receipt; the API
 * decides `paymentStatus` from the payments, never from that one figure.
 *
 * A listing can only be sold once: a second sale comes back 409 "This car has
 * already been sold.", with the id of the sale in the way.
 */
export function createCarSoldCustomer(
  carSellingId: string,
  payload: CreateCarSoldCustomerPayload,
): Promise<CarSaleResult> {
  return apiRequest<CarSaleResult>(
    `/auth/car-selling/${encodeURIComponent(carSellingId)}/sold-customer`,
    { method: 'POST', body: payload },
  )
}

/**
 * `POST /api/auth/car-selling/sold-customer/:id/payment` — the balance coming
 * in after the deal was written down. `:id` is the sale's own id, which every
 * row of the sold list already carries.
 *
 * The amount may not be more than what is still owing: the API answers 400
 * "Only 50000.00 is left to pay." with the sale's current money block in
 * `data`, so a stale screen can be corrected from the error itself.
 */
export function recordCarSoldPayment(
  carSoldCustomerId: string,
  payload: CreateCarSoldPaymentPayload,
): Promise<CarSaleResult> {
  return apiRequest<CarSaleResult>(
    `/auth/car-selling/sold-customer/${encodeURIComponent(carSoldCustomerId)}/payment`,
    { method: 'POST', body: payload },
  )
}

/**
 * `POST /api/auth/car-selling/sold-customer/:id` — corrects a recorded sale:
 * the buyer's details, the final price, or the handover. `:id` is the sale's
 * own id.
 *
 * The API works `paymentStatus` out again from the payments against the new
 * price, and refuses a price below what has already been paid with a 400.
 */
export function updateCarSoldCustomer(
  carSoldCustomerId: string,
  payload: UpdateCarSoldCustomerPayload,
): Promise<CarSaleResult> {
  return apiRequest<CarSaleResult>(
    `/auth/car-selling/sold-customer/${encodeURIComponent(carSoldCustomerId)}`,
    { method: 'POST', body: payload },
  )
}

/**
 * `POST /api/auth/car-selling/sold-customer/:id/payment/:paymentId` — corrects
 * the amount on one receipt that was typed wrong.
 *
 * The other payments plus the new amount may not pass the sale's price: the API
 * answers 400 "This payment can be at most …" with the sale's money block in
 * `data`, including `maxPaymentAmount`.
 */
export function updateCarSoldPayment(
  carSoldCustomerId: string,
  paymentId: string,
  payload: CreateCarSoldPaymentPayload,
): Promise<CarSaleResult> {
  return apiRequest<CarSaleResult>(
    `/auth/car-selling/sold-customer/${encodeURIComponent(carSoldCustomerId)}/payment/${encodeURIComponent(paymentId)}`,
    { method: 'POST', body: payload },
  )
}

export const carSoldService = {
  listSoldCars,
  getSoldCar,
  createCarSoldCustomer,
  recordCarSoldPayment,
  updateCarSoldPayment,
  updateCarSoldCustomer,
}
