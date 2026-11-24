/**
 * The "created in" dropdown shared by the Customers and Vehicles lists.
 *
 * The value is the API's `?months=`: `1` is the current month, `2` the last two
 * months (this one and the one before) and so on up to `12`. `''` means all
 * time, and is simply not sent. The API decides where a month starts (00:00 IST
 * on the 1st), so the browser's own clock never shifts the window.
 */
export type CreatedPeriod = '' | `${number}`

export const ALL_TIME: CreatedPeriod = ''

export const CREATED_PERIOD_OPTIONS: { label: string; value: CreatedPeriod }[] = [
  { label: 'All time', value: ALL_TIME },
  { label: 'Current month', value: '1' },
  ...Array.from({ length: 11 }, (_, i) => {
    const months = i + 2
    return { label: `Last ${months} months`, value: `${months}` as CreatedPeriod }
  }),
]

/** The `months` to send for a period, or nothing for all time. */
export function periodMonths(period: CreatedPeriod): { months?: number } {
  return period ? { months: Number(period) } : {}
}

/** What the period is called, for headers and exported sheets. */
export function periodLabel(period: CreatedPeriod): string {
  return CREATED_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? 'All time'
}
