import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CarFront,
  Check,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gift,
  IndianRupee,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  CtaBand,
  FaqList,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  planHref,
  useInView,
} from '@/components/public'
import type { FaqItem } from '@/components/public'
import { useAuth } from '@/context/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { MONTHLY_PRICE, YEARLY_PRICE, YEARLY_SAVING, publicPlans } from '@/lib/publicPlans'
import type { PublicPlan } from '@/lib/publicPlans'
import { cn, formatCurrency } from '@/lib/utils'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from '@/lib/publicContact'

/* ---------------------------------------------------------------- data */

type Slug = PublicPlan['slug']

/** Plan facts, shown on the cards and in the comparison table. */
const planFacts: Record<Slug, { icon: LucideIcon; access: string; billed: string; perMonth: string }> = {
  trial: {
    icon: Gift,
    access: '1 month from sign-up',
    billed: 'Nothing to pay',
    perMonth: formatCurrency(0),
  },
  monthly: {
    icon: CalendarClock,
    access: '1 month at a time',
    billed: 'Every month',
    perMonth: formatCurrency(MONTHLY_PRICE),
  },
  yearly: {
    icon: Sparkles,
    access: '12 months',
    billed: 'Once a year',
    perMonth: `≈ ${formatCurrency(Math.round(YEARLY_PRICE / 12))}`,
  },
}

/** Everything the app does — included in every plan, the trial too. */
const included: { icon: LucideIcon; label: string }[] = [
  { icon: Users, label: 'Customers & vehicles' },
  { icon: Wrench, label: 'Job cards & mechanic assignment' },
  { icon: IndianRupee, label: 'Part payments & receipts' },
  { icon: MessageCircle, label: 'WhatsApp receipt sharing' },
  { icon: FileText, label: 'Invoice & sale-receipt PDFs' },
  { icon: CarFront, label: 'Used car sales' },
  { icon: UsersRound, label: 'Staff register' },
  { icon: BarChart3, label: 'Dashboard, charts & revenue reports' },
  { icon: FileSpreadsheet, label: 'Excel export on every list' },
  { icon: Smartphone, label: 'Works on phone, tablet & desktop' },
]

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: UserPlus,
    title: 'Create your account',
    text: 'Register your garage and verify your mobile number. Your free month starts right away.',
  },
  {
    icon: BadgeCheck,
    title: 'Use every feature',
    text: 'Add customers, open job cards and take payments. Nothing is locked during the trial.',
  },
  {
    icon: CreditCard,
    title: 'Pick a plan and pay online',
    text: 'Choose Monthly or Yearly on the Subscription screen and pay securely through Razorpay.',
  },
]

const faqs: FaqItem[] = [
  {
    question: 'Do the plans differ in what they include?',
    answer:
      'No. All three plans open the same app with every feature. The plan only decides how long your access runs and how often you pay. Nothing is held back on the free trial.',
  },
  {
    question: 'When does the free trial start and end?',
    answer:
      'It starts the day your garage account is created and runs for a month. The app shows your plan, the exact end date and the days remaining in the top bar and on the dashboard.',
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
    question: 'How do I pay?',
    answer:
      'Inside the app, open the Subscription screen, pick Monthly or Yearly and pay online through Razorpay. Your plan is active as soon as the payment is confirmed.',
  },
  {
    question: 'What happens when my plan runs out?',
    answer:
      'The app marks the subscription as expired and tells you plainly. Your data stays as it is, and you can pick a new plan on the Subscription screen to carry on.',
  },
]

/* ------------------------------------------------------------ plan card */

function PlanCard({ plan, index }: { plan: PublicPlan; index: number }) {
  const { isAuthenticated } = useAuth()
  const facts = planFacts[plan.slug]
  const hot = plan.highlight

  return (
    <Reveal delay={index * 150} variant="scale" className={cn('h-full', hot && 'sm:col-span-2 lg:col-span-1')}>
      <div
        className={cn(
          'group relative flex h-full flex-col rounded-3xl p-[2px] transition-transform duration-300 hover:-translate-y-2',
          hot
            ? 'animate-shimmer bg-[linear-gradient(110deg,#f2400a,#ffb020,#f97316,#ffb020,#f2400a)] shadow-2xl shadow-accent-500/25 lg:-my-4'
            : 'bg-slate-200 hover:bg-primary-300',
        )}
      >
        <div
          className={cn(
            'relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-2px)] p-6 sm:p-7',
            hot ? 'bg-brand-navy text-white' : 'bg-white',
          )}
        >
          {hot && (
            <span className="bg-brand-flame absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-950 shadow-md">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Best value
            </span>
          )}

          <span
            aria-hidden="true"
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
              hot ? 'bg-brand-flame text-primary-950' : 'bg-primary-50 text-primary-600 ring-1 ring-primary-100',
            )}
          >
            <facts.icon className="h-6 w-6" />
          </span>

          <h3 className={cn('mt-5 text-lg font-extrabold', hot ? 'text-white' : 'text-primary-950')}>
            {plan.name}
          </h3>
          <p className={cn('mt-1 text-sm leading-relaxed', hot ? 'text-blue-100/80' : 'text-slate-500')}>
            {plan.tagline}
          </p>

          <p className="mt-6 flex items-baseline gap-1.5">
            <span className={cn('text-5xl font-black tracking-tight', hot ? 'text-white' : 'text-primary-950')}>
              {formatCurrency(plan.price)}
            </span>
            <span className={cn('text-sm', hot ? 'text-blue-100/70' : 'text-slate-500')}>{plan.period}</span>
          </p>
          {plan.note && (
            <p
              className={cn(
                'mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
                hot
                  ? 'bg-amber-400/15 text-amber-300'
                  : plan.noteTone === 'saving'
                    ? 'bg-accent-50 text-accent-700'
                    : 'bg-emerald-50 text-emerald-700',
              )}
            >
              {plan.note}
            </p>
          )}

          {/* The plan's own terms. */}
          <dl
            className={cn(
              'mt-6 space-y-2.5 rounded-2xl p-4 text-sm',
              hot ? 'bg-white/5 ring-1 ring-white/10' : 'bg-slate-50 ring-1 ring-slate-100',
            )}
          >
            {[
              ['Access', facts.access],
              ['Billed', facts.billed],
              ['Cost per month', facts.perMonth],
            ].map(([term, value]) => (
              <div key={term} className="flex items-center justify-between gap-3">
                <dt className={hot ? 'text-blue-100/70' : 'text-slate-500'}>{term}</dt>
                <dd className={cn('text-right font-semibold', hot ? 'text-white' : 'text-slate-900')}>{value}</dd>
              </div>
            ))}
          </dl>

          {/* Exactly what is included. */}
          <p
            className={cn(
              'mt-6 text-xs font-bold uppercase tracking-wider',
              hot ? 'text-amber-300' : 'text-primary-700',
            )}
          >
            Everything included
          </p>
          <ul className="mt-3 flex-1 space-y-2">
            {included.map((item) => (
              <li
                key={item.label}
                className={cn('flex items-start gap-2.5 text-sm', hot ? 'text-blue-50' : 'text-slate-700')}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                    hot ? 'bg-amber-400 text-primary-950' : 'bg-emerald-500 text-white',
                  )}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
                {item.label}
              </li>
            ))}
          </ul>

          <Link to={planHref(plan, isAuthenticated)} className="mt-7 block">
            <Button
              fullWidth
              size="lg"
              variant={hot ? 'accent' : 'outline'}
              className={hot ? undefined : '!border-primary-200 !text-primary-800 hover:!bg-primary-50'}
            >
              {plan.cta}
            </Button>
          </Link>
        </div>
      </div>
    </Reveal>
  )
}

/* ---------------------------------------------------------- comparison */

function CompareTable() {
  // On a phone only one plan column fits beside the labels, so pick it.
  const [mobilePlan, setMobilePlan] = useState<Slug>('yearly')

  const detailRows: { label: string; value: (p: PublicPlan) => string }[] = [
    { label: 'Price', value: (p) => `${formatCurrency(p.price)} ${p.period}` },
    { label: 'Billed', value: (p) => planFacts[p.slug].billed },
    { label: 'Access runs for', value: (p) => planFacts[p.slug].access },
    { label: 'Cost per month', value: (p) => planFacts[p.slug].perMonth },
    {
      label: 'You save',
      value: (p) => (p.slug === 'yearly' ? `${formatCurrency(YEARLY_SAVING)} a year` : '—'),
    },
  ]

  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-primary-900/5">
      {/* Phone: plan switcher above a two-column table. */}
      <div role="tablist" aria-label="Plan to compare" className="flex gap-1 border-b border-slate-100 p-2 sm:hidden">
        {publicPlans.map((p) => (
          <button
            key={p.slug}
            type="button"
            role="tab"
            aria-selected={mobilePlan === p.slug}
            onClick={() => setMobilePlan(p.slug)}
            className={cn(
              'flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-all',
              mobilePlan === p.slug ? 'bg-primary-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            {p.name.replace('Premium ', '')}
          </button>
        ))}
      </div>

      <table className="w-full text-left text-sm">
        <caption className="sr-only">What each GaragePilot plan includes, compared</caption>
        <thead>
          <tr className="bg-brand-navy text-white">
            <th scope="col" className="px-4 py-4 text-xs font-medium uppercase tracking-wide text-blue-100/70 sm:px-6">
              Compare plans
            </th>
            {publicPlans.map((p) => (
              <th
                key={p.slug}
                scope="col"
                className={cn(
                  'px-3 py-4 text-center sm:px-6',
                  mobilePlan !== p.slug && 'hidden sm:table-cell',
                  p.highlight && 'bg-white/5',
                )}
              >
                <span className="block text-sm font-bold">{p.name}</span>
                {p.highlight && (
                  <span className="bg-brand-flame mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-primary-950">
                    Best value
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            <th colSpan={4} scope="colgroup" className="bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-700 sm:px-6">
              Plan details
            </th>
          </tr>
          {detailRows.map((row) => (
            <tr key={row.label} className="border-t border-slate-100 transition-colors hover:bg-primary-50/40">
              <th scope="row" className="px-4 py-3.5 font-medium text-slate-600 sm:px-6">
                {row.label}
              </th>
              {publicPlans.map((p) => (
                <td
                  key={p.slug}
                  className={cn(
                    'px-3 py-3.5 text-center font-semibold text-slate-900 sm:px-6',
                    mobilePlan !== p.slug && 'hidden sm:table-cell',
                    p.highlight && 'bg-accent-50/50',
                    row.label === 'You save' && p.slug === 'yearly' && 'text-accent-700',
                  )}
                >
                  {row.value(p)}
                </td>
              ))}
            </tr>
          ))}

          <tr>
            <th colSpan={4} scope="colgroup" className="bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-700 sm:px-6">
              Features included
            </th>
          </tr>
          {included.map((item) => (
            <tr key={item.label} className="border-t border-slate-100 transition-colors hover:bg-primary-50/40">
              <th scope="row" className="px-4 py-3 font-medium text-slate-700 sm:px-6">
                <span className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                  {item.label}
                </span>
              </th>
              {publicPlans.map((p) => (
                <td
                  key={p.slug}
                  className={cn(
                    'px-3 py-3 text-center sm:px-6',
                    mobilePlan !== p.slug && 'hidden sm:table-cell',
                    p.highlight && 'bg-accent-50/50',
                  )}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    <span className="sr-only">Included</span>
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------- saving bars */

function SavingBars() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4)
  const yearlyShare = (YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100

  const bars = [
    { label: `Monthly × 12`, amount: MONTHLY_PRICE * 12, width: 100, tone: 'bg-slate-300' },
    { label: 'Yearly', amount: YEARLY_PRICE, width: yearlyShare, tone: 'bg-brand-flame' },
  ]

  return (
    <div ref={ref} className="space-y-4">
      {bars.map((bar, i) => (
        <div key={bar.label}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-blue-100/80">{bar.label}</span>
            <span className="font-bold text-white">{formatCurrency(bar.amount)}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn('h-full rounded-full transition-[width] duration-[1400ms] ease-out motion-reduce:transition-none', bar.tone)}
              style={{ width: inView ? `${bar.width}%` : '0%', transitionDelay: `${i * 250}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- page */

export function Subscription() {
  usePageMeta({
    title: 'Subscription & Pricing — GaragePilot',
    description:
      'GaragePilot pricing: free for 1 month, then ₹149 per month or ₹1,499 per year — a saving of ₹289. Every plan includes every feature.',
    type: 'article',
  })

  const trust = [
    { icon: Gift, text: '1 month free' },
    { icon: BadgeCheck, text: 'Every feature in every plan' },
    { icon: Lock, text: 'Secure Razorpay payments' },
    { icon: ShieldCheck, text: 'No card needed for the trial' },
  ]

  return (
    <>
      <PageHero
        id="pricing-page-title"
        eyebrow="Subscription"
        title="Simple, honest pricing for"
        highlight="your garage"
        lead="Start free for a month. Then choose to pay monthly or yearly. Every plan includes every feature, so the only difference is how long you pay for."
        className="pb-28 sm:pb-32"
      >
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {trust.map((item, i) => (
            <Reveal as="li" key={item.text} delay={i * 100} variant="scale">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-blue-50 backdrop-blur">
                <item.icon className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                {item.text}
              </span>
            </Reveal>
          ))}
        </ul>
      </PageHero>

      {/* ------------------------------------------------------- cards */}
      <section aria-label="Plans" className="relative z-10 -mt-20 sm:-mt-24">
        <div className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 pb-16 sm:grid-cols-2 sm:px-6 sm:pb-20 lg:grid-cols-3">
          {publicPlans.map((plan, i) => (
            <PlanCard key={plan.code} plan={plan} index={i} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- saving band */}
      <Section tone="navy" labelledBy="saving-title">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal variant="left">
            <SectionHeading
              id="saving-title"
              align="left"
              tone="light"
              eyebrow="Yearly saves more"
              title="Pay once a year and save"
              highlight={formatCurrency(YEARLY_SAVING)}
              lead={`The same app for 12 months at ${formatCurrency(YEARLY_PRICE)}, instead of ${formatCurrency(
                MONTHLY_PRICE,
              )} every month. That works out to about ${formatCurrency(
                Math.round(YEARLY_PRICE / 12),
              )} a month.`}
            />
          </Reveal>
          <Reveal variant="scale" delay={150}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
              <SavingBars />
              <p className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                You keep {formatCurrency(YEARLY_SAVING)} every year
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------------- compare */}
      <Section tone="tinted" labelledBy="compare-title">
        <Reveal>
          <SectionHeading
            id="compare-title"
            eyebrow="Side by side"
            title="What each plan"
            highlight="includes"
            lead="Every feature is included in every plan. Only the price and how long your access runs are different."
          />
        </Reveal>
        <Reveal delay={150}>
          <CompareTable />
        </Reveal>
      </Section>

      {/* ------------------------------------------------- how to start */}
      <Section labelledBy="steps-title">
        <Reveal>
          <SectionHeading
            id="steps-title"
            eyebrow="Getting started"
            title="Up and running in"
            highlight="3 easy steps"
          />
        </Reveal>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 180}>
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl">
                <span className="absolute right-5 top-4 text-5xl font-black text-slate-100 transition-colors group-hover:text-accent-100">
                  {i + 1}
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="relative mt-4 text-base font-bold text-primary-950">{step.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={300}>
          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/50 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-sm text-slate-700">
              <strong className="text-primary-950">Questions about a plan?</strong> Call, WhatsApp or{' '}
              <Link to="/contact" className="font-semibold text-primary-600 hover:text-primary-700">
                message us
              </Link>
              .
            </p>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-5">
              <a href={CONTACT_PHONE_HREF} className="inline-flex items-center justify-center gap-2 font-semibold text-primary-700 hover:text-accent-600">
                <Phone aria-hidden="true" className="h-4 w-4 text-accent-500" />
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={CONTACT_EMAIL_HREF}
                className="inline-flex min-w-0 items-center justify-center gap-2 [overflow-wrap:anywhere] font-semibold text-primary-700 hover:text-accent-600"
              >
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-500" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* --------------------------------------------------------- FAQ */}
      <Section tone="tinted" labelledBy="pricing-faq-title">
        <Reveal>
          <SectionHeading id="pricing-faq-title" eyebrow="FAQ" title="Questions about" highlight="the plans" />
        </Reveal>
        <Reveal delay={150}>
          <div className="mx-auto mt-10 max-w-3xl">
            <FaqList items={faqs} />
          </div>
        </Reveal>
      </Section>

      <CtaBand
        title="A month free is a month of real work"
        lead="Create your garage account and run a few job cards through it before you pay anything."
        secondary={{ label: 'See all features', to: '/features' }}
      />
    </>
  )
}
