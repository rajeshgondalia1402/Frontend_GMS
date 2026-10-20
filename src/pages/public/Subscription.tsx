import { Link } from 'react-router-dom'
import { Info, Mail, Phone } from 'lucide-react'
import {
  CtaBand,
  FaqList,
  PageHero,
  PricingCards,
  Section,
  SectionHeading,
} from '@/components/public'
import type { FaqItem } from '@/components/public'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  MONTHLY_PRICE,
  YEARLY_PRICE,
  YEARLY_SAVING,
  publicPlans,
} from '@/lib/publicPlans'
import { formatCurrency } from '@/lib/utils'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from '@/lib/publicContact'

/** The length of access each plan buys, spelled out for the table. */
const accessLength: Record<string, string> = {
  trial: '1 month from the day you register',
  monthly: '1 month, renewed monthly',
  yearly: '12 months',
}

const billing: Record<string, string> = {
  trial: 'Nothing to pay',
  monthly: 'Monthly',
  yearly: 'Once a year',
}

const faqs: FaqItem[] = [
  {
    question: 'When does the free trial start and end?',
    answer:
      'It starts the day your garage account is created and runs for a month. The app shows the plan, the exact end date and the days remaining in the top bar and on the dashboard, and it counts down in whole days.',
  },
  {
    question: 'Is the yearly plan really cheaper?',
    answer: `Yes. ${formatCurrency(MONTHLY_PRICE)} × 12 is ${formatCurrency(
      MONTHLY_PRICE * 12,
    )}, so paying ${formatCurrency(YEARLY_PRICE)} once saves ${formatCurrency(
      YEARLY_SAVING,
    )} over the same twelve months.`,
  },
  {
    question: 'Do the plans differ in what they include?',
    answer:
      'No. All three open the same app with the same screens — the plan only decides how long your access runs. Nothing is held back on the trial either.',
  },
  {
    question: 'What happens when my plan runs out?',
    answer:
      'The app marks the subscription expired and says so plainly instead of quietly locking you out mid-job. Your data stays as it is, and picking a new plan on the Subscription screen inside the app is how you tell us to put you back on.',
  },
]

export function Subscription() {
  usePageMeta({
    title: 'Subscription & Pricing — GaragePilot',
    description:
      'GaragePilot pricing: free for 1 month, then ₹149 per month or ₹1,499 per year — a saving of ₹289. Every plan opens the same app.',
    type: 'article',
  })

  return (
    <>
      <PageHero
        id="pricing-page-title"
        eyebrow="Subscription"
        title="Simple pricing for"
        highlight="one garage"
        lead="Start on a month of free trial, then pick the billing period that suits you. The plan sets how long your access runs — never which features you get."
        className="pb-24 sm:pb-28"
      />

      <section aria-label="Plans" className="relative z-10 -mt-16 sm:-mt-20">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <PricingCards />
        </div>
      </section>

      <Section tone="tinted" labelledBy="compare-title">
        <SectionHeading
          id="compare-title"
          eyebrow="Side by side"
          title="The three plans,"
          highlight="compared"
          lead="Price, how often you are billed, and how long each plan runs."
        />

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          {/* A table from tablet width up; the same facts as a stack of
              definition lists on a phone, where five columns cannot fit. */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">GaragePilot subscription plans compared</caption>
              <thead className="bg-brand-navy text-xs uppercase tracking-wide text-amber-300">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Plan
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Price
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Billed
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Access runs for
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publicPlans.map((plan) => (
                  <tr key={plan.code} className={plan.highlight ? 'bg-accent-50/60' : undefined}>
                    <th scope="row" className="px-5 py-4 font-semibold text-slate-900">
                      {plan.name}
                      {plan.highlight && (
                        <span className="bg-brand-flame ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-950">
                          Best value
                        </span>
                      )}
                    </th>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {formatCurrency(plan.price)}{' '}
                      <span className="font-normal text-slate-500">{plan.period}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{billing[plan.slug]}</td>
                    <td className="px-5 py-4 text-slate-600">{accessLength[plan.slug]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 sm:hidden">
            {publicPlans.map((plan) => (
              <dl key={plan.code} className="p-4">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                  {plan.name}
                  {plan.highlight && (
                    <span className="bg-brand-flame rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-950">
                      Best value
                    </span>
                  )}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Price</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {formatCurrency(plan.price)} {plan.period}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Billed</dt>
                    <dd className="text-right text-slate-700">{billing[plan.slug]}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Access runs for</dt>
                    <dd className="text-right text-slate-700">{accessLength[plan.slug]}</dd>
                  </div>
                </div>
              </dl>
            ))}
          </div>
        </div>

        {/* The one thing a pricing page must not be vague about. */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-card sm:flex-row sm:p-6">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
          >
            <Info className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-primary-950">How paying works today</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Online checkout is not part of the app yet, and we would rather say so than send you
              to a payment page that does not exist. Every account starts on the free trial, so{' '}
              <strong>Choose Monthly</strong> and <strong>Choose Yearly</strong> take you through
              registration first and carry your choice to the Subscription screen inside the app,
              where plans are picked. If you are already signed in, they go straight there. You can
              also{' '}
              <Link to="/contact" className="font-medium text-primary-600 hover:text-primary-700">
                contact us
              </Link>{' '}
              about a plan.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:gap-5">
              <a
                href={CONTACT_PHONE_HREF}
                className="inline-flex items-center gap-2 font-semibold text-primary-700 hover:text-accent-600"
              >
                <Phone aria-hidden="true" className="h-4 w-4 text-accent-500" />
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={CONTACT_EMAIL_HREF}
                className="inline-flex min-w-0 items-center gap-2 [overflow-wrap:anywhere] font-semibold text-primary-700 hover:text-accent-600"
              >
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-500" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section labelledBy="pricing-faq-title">
        <SectionHeading id="pricing-faq-title" eyebrow="FAQ" title="About" highlight="the plans" />

        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList items={faqs} />
        </div>
      </Section>

      <CtaBand
        title="A month free is a month of real work"
        lead="Create your garage account and run a few job cards through it before you pay anything."
        secondary={{ label: 'See all features', to: '/features' }}
      />
    </>
  )
}
