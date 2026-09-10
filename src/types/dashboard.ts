/** Types mirroring the Node.js API contract for `/api/auth/dashboard`. */

/**
 * The window the "this month" figures were counted over — midnight on the 1st
 * up to the moment the summary was taken, on the **server's** calendar.
 *
 * It comes back with the figures so the screen can name the month it is
 * showing rather than working it out from the browser's own clock, which may
 * be a day either side of the server's.
 */
export interface DashboardMonth {
  startDate: string
  endDate: string
}

/** Counted by `createdAt`, like the vehicles and the job cards. */
export interface DashboardCustomers {
  total: number
  thisMonth: number
}

export interface DashboardVehicles {
  total: number
  thisMonth: number
  /** Waiting to be worked on. All time, not this month. */
  pending: number
  /** On the ramp right now. All time, not this month. */
  inService: number
}

export interface DashboardJobCards {
  total: number
  thisMonth: number
  /**
   * Cards with nothing collected against them, and cards part collected.
   *
   * Both are all time rather than this month: an unpaid bill from March is
   * still owed in September, and a month boundary would hide exactly what a
   * garage opens this screen to see.
   */
  unpaid: number
  partiallyPaid: number
}

/** Money **collected**, counted by the date each payment came in. */
export interface DashboardRevenue {
  total: number
  thisMonth: number
}

/**
 * `GET /api/auth/dashboard/summary` — every tile on the dashboard in one
 * answer, so the screen does not open with a dozen requests racing each other.
 *
 * A garage with nothing on it yet is a 200 with zeros all the way down, never
 * a 404: having no customers on the first day is a normal state of a garage.
 */
export interface DashboardSummary {
  month: DashboardMonth
  customers: DashboardCustomers
  vehicles: DashboardVehicles
  jobCards: DashboardJobCards
  revenue: DashboardRevenue
}
