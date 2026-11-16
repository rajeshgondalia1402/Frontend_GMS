import { apiRequest } from './httpClient'
import type { SalaryListData, SalaryListParams, SalaryPayload, SalaryRecord } from '@/types/salary'

/** Builds the query tail; anything left unset falls back to the API default. */
function salaryQuery(params: SalaryListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.fromDate) query.set('fromDate', params.fromDate)
  if (params.toDate) query.set('toDate', params.toDate)
  if (params.staffId) query.set('staffId', params.staffId)
  if (params.paymentMode) query.set('paymentMode', params.paymentMode)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

/**
 * `GET /api/auth/staff-salary` — the Salary report. `search` matches the staff
 * name, role, category, mobile number, remarks and payment mode; with neither
 * date sent the API returns the current month. `summary` covers every row the
 * filters match, not just this page.
 */
export function listSalaries(params: SalaryListParams = {}): Promise<SalaryListData> {
  return apiRequest<SalaryListData>(`/auth/staff-salary${salaryQuery(params)}`)
}

/** `POST /api/auth/staff-salary` — the staff member must belong to this garage. */
export function createSalary(payload: SalaryPayload): Promise<SalaryRecord> {
  return apiRequest<SalaryRecord>('/auth/staff-salary', { method: 'POST', body: payload })
}

/** `PUT /api/auth/staff-salary/:id` — partial; send what changed. */
export function updateSalary(id: string, payload: Partial<SalaryPayload>): Promise<SalaryRecord> {
  return apiRequest<SalaryRecord>(`/auth/staff-salary/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/** `DELETE /api/auth/staff-salary/:id` — a soft delete. */
export function deleteSalary(id: string): Promise<{ id: string; isDelete: boolean; deletedAt: string }> {
  return apiRequest(`/auth/staff-salary/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export const salaryService = {
  listSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
}
