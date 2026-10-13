import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, cn } from '@/lib/utils'
import { planIncludes, publicPlans } from '@/lib/publicPlans'
import type { PublicPlan } from '@/lib/publicPlans'

/**
 * Where a plan's button goes.
 *
 * The free trial is what registration already starts, so it goes to the
 * existing `/register` screen. A paid plan is chosen inside the app, on
 * `/app/subscription`, so a visitor who is not signed in registers first and
 * the choice rides along in `?plan=` for that screen to read — no second
 * sign-up and no second subscription flow.
 */
export function planHref(plan: PublicPlan, isAuthenticated: boolean): string {
  if (isAuthenticated) {
    return plan.slug === 'trial' ? '/app/subscription' : `/app/subscription?plan=${plan.slug}`
  }
  return plan.slug === 'trial' ? '/register' : `/register?plan=${plan.slug}`
}

export function PricingCards({ includes = true }: { includes?: boolean }) {
  const { isAuthenticated } = useAuth()

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {publicPlans.map((plan) => (
          <div
            key={plan.code}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft sm:p-6',
              plan.highlight
                ? 'border-primary-300 ring-1 ring-primary-200 sm:col-span-2 lg:col-span-1'
                : 'border-slate-200',
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-3 py-1 text-xs font-bold text-primary-950 shadow-sm">
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> Best Value
                </span>
              </span>
            )}

            <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{plan.tagline}</p>

            <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {formatCurrency(plan.price)}
              </span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </p>
            <p
              className={cn(
                'mt-1.5 min-h-[18px] text-xs font-semibold',
                plan.noteTone === 'saving' ? 'text-accent-700' : 'text-emerald-700',
              )}
            >
              {plan.note}
            </p>

            <div className="mt-5 flex-1" />

            <Link to={planHref(plan, isAuthenticated)} className="block">
              <Button fullWidth size="lg" variant={plan.highlight ? 'primary' : 'outline'}>
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {includes && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Every plan opens the same app
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            A plan sets how long your access runs — not which screens you can open. All three
            include:
          </p>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {planIncludes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
