import { apiRequest } from './httpClient'
import type { DashboardMonthlyChart, DashboardSummary } from '@/types/dashboard'

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

/**
 * `GET /api/auth/dashboard/monthly?year=` — revenue and job cards month by
 * month for the bar charts. Without a year the server uses the current one.
 */
export function getDashboardMonthly(year?: number): Promise<DashboardMonthlyChart> {
  const query = year ? `?year=${year}` : ''
  return apiRequest<DashboardMonthlyChart>(`/auth/dashboard/monthly${query}`)
}

export const dashboardService = { getDashboardSummary, getDashboardMonthly }
