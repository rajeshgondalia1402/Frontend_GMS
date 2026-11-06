import type { ReactNode } from 'react'

/** Title block at the top of every auth form: left aligned, SaaS style. */
export function AuthHeader({ title, subtitle, icon }: { title: string; subtitle?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-7">
      {icon && (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
          {icon}
        </span>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
    </div>
  )
}
