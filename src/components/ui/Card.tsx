import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export function Card({ className, children, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-card', padded && 'p-4 sm:p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}
