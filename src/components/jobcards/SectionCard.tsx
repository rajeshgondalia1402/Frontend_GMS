import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  icon: LucideIcon
  title: string
  /** Optional control shown on the right of the heading. */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled panel of the job card form — icon tile, heading, optional action. */
export function SectionCard({ icon: Icon, title, action, children, className }: SectionCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </Card>
  )
}
