import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** The wordmark, trimmed and sized down from `public/GMS_Logo.png`. */
const LOGO_SRC = '/brand/garagepilot-logo.png'

/**
 * The GaragePilot lockup.
 *
 * The logo is a wordmark — it already carries the name and the tagline — so
 * nothing is set beside it. On the dark footer it sits on a white plate: the
 * navy "Smart Garage Management" line all but disappears against `slate-900`,
 * and recolouring someone's logo to fix that is not ours to do.
 */
export function BrandMark({
  to = '/',
  tone = 'dark',
  className,
  /** Rendered height in pixels; the width follows the logo's own ratio. */
  height = 36,
}: {
  to?: string
  /** `light` for use on the dark footer. */
  tone?: 'dark' | 'light'
  className?: string
  height?: number
}) {
  const image = (
    <img
      src={LOGO_SRC}
      alt="GaragePilot — Smart Garage Management"
      width={718}
      height={216}
      // Above the fold in the header, so it is not lazily loaded.
      decoding="async"
      className="block w-auto"
      style={{ height }}
    />
  )

  return (
    <Link
      to={to}
      aria-label="GaragePilot — home"
      className={cn(
        'inline-flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        tone === 'light' && 'rounded-xl bg-white px-3 py-2 shadow-sm',
        className,
      )}
    >
      {image}
    </Link>
  )
}
