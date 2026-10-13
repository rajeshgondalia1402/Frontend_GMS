export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

/**
 * The month as this app writes a date. Spelled out rather than left to
 * `toLocaleDateString`, whose short month moves with the browser's locale and
 * whose `en-IN` short form is a number — `07/09/2026` — not a name.
 */
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * `05-Sept-2026` — day padded, month named, year in full, in local time.
 *
 * The named month is what keeps the day and the month apart at a glance:
 * `05-09-2026` and `09-05-2026` are the same six digits in a different order,
 * and a garage reading a row quickly should never have to work out which is
 * which. One format for every date the app shows.
 */
export function formatDayMonthYear(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}-${MONTH_NAMES[date.getMonth()]}-${date.getFullYear()}`
}

/** `05-Sept-2026` from an ISO value, for the list and detail screens. */
export function formatDate(date: string): string {
  const parsed = Date.parse(date)
  // Mock data already carries display-ready strings; only ISO values are
  // formatted, and anything unparseable is handed back as it came.
  return Number.isNaN(parsed) ? date : formatDayMonthYear(new Date(parsed))
}

/** First letter of the owner's name, used for the avatar badge. */
export function getInitial(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || '?'
}

/** First name only — keeps the topbar compact. */
export function getFirstName(name?: string | null): string {
  return name?.trim().split(/\s+/)[0] || ''
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

/** Seconds as `mm:ss`, for countdown timers. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/** Midnight of a date's calendar day, in local time — so days count as days. */
function startOfDay(value: string | Date): Date | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Whole calendar days from `from` to `to` (today when left out), or `null`
 * when either is not a date. Negative when `to` comes first.
 */
export function daysBetween(from: string | Date, to: string | Date = new Date()): number | null {
  const start = startOfDay(from)
  const end = startOfDay(to)
  if (!start || !end) return null
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

/** `3 days`, `2 months`, `1 year` — a span of days as a person would say it. */
export function spanLabel(days: number): string {
  const n = Math.abs(days)
  const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`
  if (n < 31) return plural(n, 'day')
  if (n < 365) return plural(Math.floor(n / 30), 'month')
  return plural(Math.floor(n / 365), 'year')
}

/** `Today`, `Yesterday`, `12 days ago`, `2 months ago` — or `null` for a bad date. */
export function agoLabel(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const days = daysBetween(value)
  if (days === null) return null
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${spanLabel(days)} ago`
}
