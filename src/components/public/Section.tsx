import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Eyebrow, HeroBackdrop } from './PageHero'

/**
 * One band of a public page: a semantic `<section>`, the shared gutter (never
 * below 16px, so 320px screens keep their margins) and the shared vertical
 * rhythm.
 */
export function Section({
  id,
  tone = 'plain',
  className,
  children,
  labelledBy,
  flush,
}: {
  id?: string
  /**
   * `tinted` for the alternating cool band, `dark` for the inverted slate one,
   * `navy` for the logo-blue band with the speed lines behind it.
   */
  tone?: 'plain' | 'tinted' | 'dark' | 'navy'
  className?: string
  children: ReactNode
  /** Id of the heading that names this section, for screen readers. */
  labelledBy?: string
  /**
   * Drops the padding on one edge, so two bands can sit flush against each
   * other — a page header and the panel that belongs to it, say.
   */
  flush?: 'top' | 'bottom'
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        'scroll-mt-28',
        tone === 'tinted' && 'bg-gradient-to-b from-slate-50 to-primary-50/40',
        tone === 'dark' && 'bg-slate-900',
        tone === 'navy' && 'relative isolate overflow-hidden bg-brand-navy',
        className,
      )}
    >
      {tone === 'navy' && <HeroBackdrop />}
      <div
        className={cn(
          'relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20',
          flush === 'top' && 'pt-0 sm:pt-0',
          flush === 'bottom' && 'pb-0 sm:pb-0',
        )}
      >
        {children}
      </div>
    </section>
  )
}

/** Eyebrow, heading and lead paragraph, centred or left aligned. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  highlight,
  lead,
  align = 'center',
  tone = 'dark',
  level = 2,
}: {
  id?: string
  eyebrow?: string
  title: string
  /** Set after the title in the logo's orange gradient. */
  highlight?: string
  lead?: string
  align?: 'center' | 'left'
  /** `light` when the section sits on the dark band. */
  tone?: 'dark' | 'light'
  /**
   * `1` for the heading that names the page — one per page, and the only
   * level that may be skipped to. Every other section heading stays at `2`.
   */
  level?: 1 | 2
}) {
  const Heading = level === 1 ? 'h1' : 'h2'

  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
      )}
    >
      {eyebrow && (
        <Eyebrow tone={tone} align={align}>
          {eyebrow}
        </Eyebrow>
      )}
      <Heading
        id={id}
        className={cn(
          'mt-3 font-extrabold tracking-tight',
          level === 1 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl lg:text-4xl',
          tone === 'light' ? 'text-white' : 'text-primary-950',
        )}
      >
        {title}
        {highlight && (
          <>
            {' '}
            <span className="text-brand-flame">{highlight}</span>
          </>
        )}
      </Heading>
      {lead && (
        <p
          className={cn(
            'mt-3 text-base leading-relaxed',
            tone === 'light' ? 'text-blue-100/80' : 'text-slate-600',
          )}
        >
          {lead}
        </p>
      )}
    </div>
  )
}
