import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

/**
 * Any icon drawn in `currentColor` and sized by a class — every `lucide-react`
 * icon, and the hand-drawn `WhatsappIcon` the app already ships.
 */
export type FeatureIcon = ComponentType<{ className?: string }>

export type FeatureTone = 'primary' | 'emerald' | 'amber' | 'sky' | 'violet' | 'rose'

const iconTones: Record<FeatureTone, string> = {
  primary: 'bg-primary-50 text-primary-600 ring-primary-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
}

export interface Feature {
  icon: FeatureIcon
  title: string
  description: string
  tone?: FeatureTone
  /** The specifics, where naming them says more than the paragraph does. */
  points?: string[]
}

/**
 * One capability, in the app's own card shape — the border, radius and
 * `shadow-card` of `components/ui/Card`, lifted a little on hover so a grid of
 * them reads as a set of things rather than a wall of text.
 */
export function FeatureCard({ icon: Icon, title, description, tone = 'primary', points }: Feature) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/10 sm:p-6">
      {/* The logo's orange streak, drawn across the top on hover. */}
      <span
        aria-hidden="true"
        className="bg-brand-flame absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
          iconTones[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <h3 className="mt-4 text-base font-bold text-primary-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

      {points && points.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
          {points.map((point) => (
            <li key={point} className="flex gap-2 text-xs leading-relaxed text-slate-500">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
