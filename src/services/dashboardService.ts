import { apiRequest } from './httpClient'
import type { DashboardSummary } from '@/types/dashboard'

/**
 * `GET /api/auth/dashboard/summary` — the whole top of the dashboard in one
 * call: how many customers, vehicles and job cards the garage has, how many of
 * each were opened this month, what has been collected, and what is still
 * waiting on it.
 *
 * Every figure is counted for the garage the token belongs to, so nothing is
 * sent with it.
 */
export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/auth/dashboard/summary')
}

export const dashboardService = { getDashboardSummary }
