import { formatSubscriptionDate } from './subscription'

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

export function formatDate(date: string): string {
  // Mock data already carries display-ready strings; only ISO values are formatted.
  return formatSubscriptionDate(date) ?? date
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
