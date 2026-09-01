import { apiRequest } from './httpClient'
import type {
  CreateJobCardPayload,
  JobCardListData,
  JobCardListParams,
  JobCardRecord,
  UpdateJobCardPayload,
} from '@/types/jobCard'

/** Builds the query tail; anything left unset falls back to the API default. */
function jobCardQuery(params: JobCardListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const tail = query.toString()
  return tail ? `?${tail}` : ''
}

/** `GET /api/auth/jobcard/job-number` — the one value it returns. */
export interface JobNumberData {
  /** `JC-<year>-<sequence>`, the sequence padded to four digits. */
  jobNumber: string
}

/**
 * `GET /api/auth/jobcard/job-number` — the number to print on the card that is
 * about to be created. No query string, no body: the garage comes from the
 * token and each garage counts on its own, restarting at `0001` every January.
 *
 * Nothing is written, so this is a suggestion rather than a reservation: the
 * screen asks as it opens and shows the value read only. Two desks asking at
 * the same moment are told the same number, and whichever saves second is
 * turned away by the unique index and asks again.
 */
export function getJobNumber(): Promise<JobNumberData> {
  return apiRequest<JobNumberData>('/auth/jobcard/job-number')
}

/**
 * `POST /api/auth/jobcard` — the card, its lines and the vehicle's new
 * odometer reading and complaint, in one call and one transaction.
 *
 * The API sets the status, the garage and every total itself; sending them
 * changes nothing. A `jobNumber` another desk has just used comes back 409 —
 * the number was only ever a suggestion, so ask for the next one and post
 * again.
 */
export function createJobCard(payload: CreateJobCardPayload): Promise<JobCardRecord> {
  return apiRequest<JobCardRecord>('/auth/jobcard', {
    method: 'POST',
    body: payload,
  })
}

/**
 * `GET /api/auth/jobcard/:id` — one card, in exactly the shape a row of the
 * list has, so a screen opened from either renders the same data and nothing
 * is mapped twice.
 */
export function getJobCard(id: string): Promise<JobCardRecord> {
  return apiRequest<JobCardRecord>(`/auth/jobcard/${encodeURIComponent(id)}`)
}

/**
 * `PUT /api/auth/jobcard/:id` — the card and its lines in one transaction.
 * `items` is the whole set the card should end up with: a line already on it
 * carries its id, a new line does not, and one left out is removed.
 */
export function updateJobCard(
  id: string,
  payload: UpdateJobCardPayload,
): Promise<JobCardRecord> {
  return apiRequest<JobCardRecord>(`/auth/jobcard/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/**
 * `GET /api/auth/jobcard` — a page of this garage's cards, each carrying the
 * vehicle it is for (with that vehicle's customer) and all of its billable
 * lines, so a list row renders in full with no follow-up call per card.
 *
 * Defaults: page 1, limit 10, newest first by `createdAt`.
 */
export async function listJobCards(params: JobCardListParams = {}): Promise<JobCardListData> {
  const payload = await apiRequest<unknown>(`/auth/jobcard${jobCardQuery(params)}`)
  return readJobCardList(payload)
}

/**
 * Finds the cards in whatever the API wrapped them in.
 *
 * The documented shape is `{ jobCards, pagination }`, but the table behind it
 * is `service_jobs` and the handler is `listServiceJobs`, so the array has also
 * come back as `serviceJobs` — and reading only `jobCards` there gives an empty
 * list with nothing to show for it. Any single array in the object is taken as
 * the cards, and a bare array is taken as read.
 */
function readJobCardList(payload: unknown): JobCardListData {
  if (Array.isArray(payload)) return { jobCards: payload as JobCardRecord[], pagination: fallbackPagination(payload.length) }

  if (!payload || typeof payload !== 'object') return { jobCards: [], pagination: fallbackPagination(0) }

  const source = payload as Record<string, unknown>
  const named = ['jobCards', 'serviceJobs', 'jobcards', 'jobs', 'items', 'data']
    .map((key) => source[key])
    .find(Array.isArray) as JobCardRecord[] | undefined

  // Nothing recognised: the one array in the object is what was asked for.
  const rows = named ?? (Object.values(source).find(Array.isArray) as JobCardRecord[] | undefined) ?? []

  // An empty list is normal; an empty list out of a body that plainly holds
  // something is a shape this does not know about, and worth saying so.
  if (import.meta.env.DEV && rows.length === 0 && Object.keys(source).length > 0) {
    console.warn('[jobCards] no cards found in the response. Keys:', Object.keys(source), source)
  }

  const pagination = source.pagination
  return {
    jobCards: rows,
    pagination:
      pagination && typeof pagination === 'object'
        ? (pagination as JobCardListData['pagination'])
        : fallbackPagination(rows.length),
  }
}

/** One page holding everything, for an API that returns no pagination block. */
function fallbackPagination(total: number): JobCardListData['pagination'] {
  return {
    page: 1,
    limit: total || 10,
    total,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  }
}

export const jobCardService = {
  getJobNumber,
  createJobCard,
  getJobCard,
  updateJobCard,
  listJobCards,
}
