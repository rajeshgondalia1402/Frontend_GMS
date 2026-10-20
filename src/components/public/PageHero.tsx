import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The dark navy band that opens every inner public page — the "Garage" blue of
 * the logo, with its orange speed lines streaking across, so each page reads
 * as part of the same brand as the wordmark in the header.
 */
export function PageHero({
  id,
  eyebrow,
  title,
  highlight,
  lead,
  children,
  className,
}: {
  /** Id of the `<h1>`, for the section's `aria-labelledby`. */
  id: string
  eyebrow: string
  title: string
  /** Set after the title in the logo's orange gradient. */
  highlight?: string
  lead?: string
  /** Anything that belongs in the hero under the lead — buttons, chips. */
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('relative isolate overflow-hidden bg-brand-navy text-white', className)}
    >
      <HeroBackdrop />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
        <Eyebrow tone="light" align="center">
          {eyebrow}
        </Eyebrow>
        <h1
          id={id}
          className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
        >
          {title}
          {highlight && (
            <>
              {' '}
              <span className="text-brand-flame">{highlight}</span>
            </>
          )}
        </h1>
        {lead && (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100/80 sm:text-lg">
            {lead}
          </p>
        )}
        {children}
      </div>

      {/* Hazard-tape edge, like the line painted at the mouth of a service bay. */}
      <div aria-hidden="true" className="bg-hazard absolute inset-x-0 bottom-0 h-1.5 opacity-90" />
    </section>
  )
}

/** Grid, glows and the logo's speed lines, behind any dark band. */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-garage-grid absolute inset-0" />
      <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary-500/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
      {/* Three speed lines, echoing the streaks off the "P" in the logo — kept
          to the top and bottom edges so they never streak through text, and
          dropped for anyone who has asked for less motion. */}
      <div className="absolute left-0 top-5 h-[3px] w-1/3 animate-speed-line rounded-full bg-gradient-to-r from-transparent via-accent-500 to-amber-300 opacity-70 motion-reduce:hidden" />
      <div
        className="absolute left-0 top-9 h-[2px] w-1/4 animate-speed-line rounded-full bg-gradient-to-r from-transparent via-accent-400 to-amber-200 opacity-60 motion-reduce:hidden"
        style={{ animationDelay: '0.6s' }}
      />
      <div
        className="absolute bottom-6 left-0 h-[2px] w-1/5 animate-speed-line rounded-full bg-gradient-to-r from-transparent via-primary-400 to-sky-300 opacity-60 motion-reduce:hidden"
        style={{ animationDelay: '1.4s' }}
      />
    </div>
  )
}

/**
 * The small label above a heading, ruled on both sides like the
 * "— Smart Garage Management —" line under the logo.
 */
export function Eyebrow({
  children,
  tone = 'dark',
  align = 'center',
}: {
  children: ReactNode
  tone?: 'dark' | 'light'
  align?: 'center' | 'left'
}) {
  const rule = cn(
    'h-[2px] w-6 rounded-full sm:w-8',
    tone === 'light' ? 'bg-accent-400' : 'bg-accent-500',
  )
  return (
    <p
      className={cn(
        'flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em]',
        align === 'center' ? 'justify-center' : 'justify-start',
        tone === 'light' ? 'text-amber-300' : 'text-accent-600',
      )}
    >
      <span aria-hidden="true" className={rule} />
      {children}
      {align === 'center' && <span aria-hidden="true" className={rule} />}
    </p>
  )
}
