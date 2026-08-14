import { Check, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, Badge, useToast } from '@/components/ui'
import { plans } from '@/mock/plans'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Subscription() {
  const { toast } = useToast()

  return (
    <div>
      <PageHeader title="Choose Your Plan" subtitle="Continue managing your garage without interruption." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-white p-5 shadow-card',
              plan.highlight ? 'border-primary-300 ring-1 ring-primary-200' : 'border-slate-200',
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge tone="primary" className="shadow-sm">
                  <Sparkles className="h-3 w-3" /> Best Value
                </Badge>
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                <span className="text-sm text-slate-500">/ {plan.duration}</span>
              </div>
            </div>

            <ul className="mb-5 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.current ? (
              <Button variant="secondary" fullWidth disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                variant={plan.highlight ? 'primary' : 'outline'}
                fullWidth
                onClick={() => toast(`Selected ${plan.name} plan`, 'success')}
              >
                Choose {plan.name}
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        All plans include full access to garage features. Cancel anytime.
      </p>
    </div>
  )
}
