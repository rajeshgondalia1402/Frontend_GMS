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
    <dl className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-colors open:border-primary-200 open:shadow-md"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-primary-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500">
            <dt className="text-sm font-bold text-primary-950 sm:text-base">{item.question}</dt>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-all duration-200 group-open:rotate-180 group-open:bg-accent-500 group-open:text-primary-950"
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>
          <dd className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.answer}</dd>
        </details>
      ))}
    </dl>
  )
}
