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
    <article className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft">
      <span
        aria-hidden="true"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105',
          iconTones[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

      {points && points.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
          {points.map((point) => (
            <li key={point} className="flex gap-2 text-xs leading-relaxed text-slate-500">
              <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
