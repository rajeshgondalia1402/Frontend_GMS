import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  question: string
  /** Plain text, or markup where a link belongs in the answer. */
  answer: ReactNode
}

/**
 * Built on `<details>` / `<summary>` rather than a hand-rolled accordion: the
 * browser already gives it keyboard operation, the open/closed state and the
 * right semantics, and it still works before any JavaScript has run.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <dl className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500">
            <dt className="text-sm font-semibold text-slate-900">{item.question}</dt>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <dd className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.answer}</dd>
        </details>
      ))}
    </dl>
  )
}
