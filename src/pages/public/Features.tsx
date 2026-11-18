import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Info,
  IndianRupee,
  LayoutGrid,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  CountUp,
  CtaBand,
  DashboardPreview,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  useInView,
  type Feature,
  type FeatureTone,
} from '@/components/public'
import { usePageMeta } from '@/hooks/usePageMeta'
import { features } from '@/lib/publicContent'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------ categories */

type CategoryId = 'all' | 'workshop' | 'money' | 'insight' | 'platform'

const categories: { id: CategoryId; label: string; icon: LucideIcon; blurb: string }[] = [
  { id: 'all', label: 'All features', icon: LayoutGrid, blurb: 'Everything GaragePilot does today.' },
  {
    id: 'workshop',
    label: 'Workshop',
    icon: Wrench,
    blurb: 'Customers, vehicles, job cards, staff and the cars you sell.',
  },
  {
    id: 'money',
    label: 'Payments & paperwork',
    icon: IndianRupee,
    blurb: 'Take payment, send receipts, and print or export your records.',
  },
  {
    id: 'insight',
    label: 'Reports',
    icon: BarChart3,
    blurb: 'Your figures at a glance, plus revenue reports you can filter and print.',
  },
  {
    id: 'platform',
    label: 'Mobile & security',
    icon: ShieldCheck,
    blurb: 'Works on any phone, with a verified, secure sign-in.',
  },
]

/** Which tab each feature (by title) is listed under. */
const categoryOf: Record<string, Exclude<CategoryId, 'all'>> = {
  'Customers & their vehicles': 'workshop',
  'Job cards from intake to delivery': 'workshop',
  'Used car sales': 'workshop',
  'Staff register': 'workshop',
  'Part payments that settle the bill': 'money',
  'Receipts on WhatsApp': 'money',
  'Invoice & sale receipt PDFs': 'money',
  'Excel export': 'money',
  'A dashboard worth opening': 'insight',
  'Charts and revenue reports': 'insight',
  'Built for the phone at the counter': 'platform',
  'Verified sign-up, separate sessions': 'platform',
}

const tones: Record<FeatureTone, { icon: string; glow: string; dot: string }> = {
  primary: { icon: 'from-primary-500 to-primary-700', glow: 'bg-primary-400/20', dot: 'bg-primary-500' },
  emerald: { icon: 'from-emerald-400 to-emerald-600', glow: 'bg-emerald-400/20', dot: 'bg-emerald-500' },
  amber: { icon: 'from-amber-400 to-orange-500', glow: 'bg-amber-400/25', dot: 'bg-amber-500' },
  sky: { icon: 'from-sky-400 to-sky-600', glow: 'bg-sky-400/20', dot: 'bg-sky-500' },
  violet: { icon: 'from-violet-400 to-violet-600', glow: 'bg-violet-400/20', dot: 'bg-violet-500' },
  rose: { icon: 'from-rose-400 to-rose-600', glow: 'bg-rose-400/20', dot: 'bg-rose-500' },
}

/* --------------------------------------------------------- job journey */

const journey: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: UserPlus, title: 'Add the customer', text: 'Save their details and every vehicle they bring in.' },
  { icon: Wrench, title: 'Open a job card', text: 'Write the complaint, add parts and labour, assign a mechanic.' },
  { icon: IndianRupee, title: 'Collect payment', text: 'Take it all at once or in parts: cash, UPI or card.' },
  { icon: ReceiptText, title: 'Send the receipt', text: 'WhatsApp the receipt and download the invoice PDF.' },
  { icon: BarChart3, title: 'Read your figures', text: 'Revenue, pending work and unpaid bills on one dashboard.' },
]

function JourneyStrip() {
  const { ref, inView } = useInView<HTMLOListElement>(0.3)

  return (
    <ol ref={ref} className="relative mt-12 grid gap-8 md:grid-cols-5 md:gap-4">
      {/* The track the steps sit on, filled left to right as it scrolls in. */}
      <span
        aria-hidden="true"
        className="absolute left-6 top-6 h-[calc(100%-3rem)] w-0.5 bg-slate-200 md:left-[10%] md:right-[10%] md:h-0.5 md:w-auto"
      />
      <span
        aria-hidden="true"
        className={cn(
          'bg-brand-flame absolute left-6 top-6 w-0.5 origin-top transition-transform duration-[1800ms] ease-out motion-reduce:transition-none',
          'h-[calc(100%-3rem)] md:left-[10%] md:right-[10%] md:h-0.5 md:w-auto md:origin-left',
          inView ? 'scale-100' : 'scale-y-0 md:scale-x-0 md:scale-y-100',
        )}
      />

      {journey.map((step, i) => (
        <li
          key={step.title}
          className={cn(
            'relative flex gap-4 transition-all duration-700 motion-reduce:transition-none md:flex-col md:items-center md:text-center',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
          style={{ transitionDelay: `${200 + i * 300}ms` }}
        >
          <span
            className={cn(
              'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-lg shadow-primary-900/10 ring-1 ring-slate-200',
              i === journey.length - 1 && 'animate-pulse-ring',
            )}
          >
            <step.icon className="h-5 w-5" aria-hidden="true" />
            <span className="bg-brand-flame absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white">
              {i + 1}
            </span>
          </span>
          <div className="min-w-0 pt-1 md:pt-3">
            <h3 className="text-sm font-bold text-primary-950">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* -------------------------------------------------------- feature card */

function ShowcaseCard({ feature, index }: { feature: Feature; index: number }) {
  const { icon: Icon, title, description, points, tone = 'primary' } = feature
  const t = tones[tone]

  return (
    <article
      className="animate-card-in group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-900/10"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      {/* Soft colour wash that grows behind the icon on hover. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-150',
          t.glow,
        )}
      />
      <span
        aria-hidden="true"
        className="bg-brand-flame absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
            t.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-2xl font-black tabular-nums text-slate-100 transition-colors duration-300 group-hover:text-primary-100">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <h3 className="relative mt-5 text-lg font-bold text-primary-950">{title}</h3>
      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>

      {points && points.length > 0 && (
        <ul className="relative mt-5 space-y-2 border-t border-slate-100 pt-4">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5 text-xs leading-relaxed text-slate-600">
              <span
                aria-hidden="true"
                className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white', t.dot)}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/* --------------------------------------------------------------- page */

export function Features() {
  usePageMeta({
    title: 'Features — GaragePilot Garage Management Software',
    description:
      'Job cards, part payments and receipts, invoice PDFs, WhatsApp receipts, customers and vehicles, used car sales, staff, dashboard figures, revenue reports and Excel export — every feature in GaragePilot today.',
    type: 'article',
  })

  const [active, setActive] = useState<CategoryId>('all')
  const activeCategory = categories.find((c) => c.id === active) ?? categories[0]

  const shown = useMemo(
    () => (active === 'all' ? features : features.filter((f) => categoryOf[f.title] === active)),
    [active],
  )

  const countFor = (id: CategoryId) =>
    id === 'all' ? features.length : features.filter((f) => categoryOf[f.title] === id).length

  const stats = [
    { value: features.length, suffix: '', label: 'Features you can use today' },
    { value: 1, suffix: '', label: 'App for counter, workshop & office' },
    { value: 0, suffix: '', label: 'Things to install' },
    { value: 1, suffix: '-month', label: 'Free trial, no card needed' },
  ]

  return (
    <>
      <PageHero
        id="features-page-title"
        eyebrow="Features"
        title="Every tool your workshop needs,"
        highlight="in one app"
        lead="Run your garage from intake to invoice: customers, job cards, payments, WhatsApp receipts and reports, all in one place. Everything on this page already works in the app."
      >
        <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120} variant="scale">
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur transition-colors duration-300 hover:border-accent-400/40 hover:bg-white/10">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  <span className="text-brand-flame">
                    <CountUp value={stat.value} />
                    {stat.suffix}
                  </span>
                </dd>
                <dd className="mt-1 text-xs leading-snug text-blue-100/80">{stat.label}</dd>
              </div>
            </Reveal>
          ))}
        </dl>

        <a
          href="#features-grid-title"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-blue-100/80 transition-colors hover:text-white"
        >
          Explore the features
          <ChevronDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </a>
      </PageHero>

      {/* ------------------------------------------------------ journey */}
      <Section labelledBy="features-journey-title">
        <Reveal>
          <SectionHeading
            id="features-journey-title"
            eyebrow="How it fits together"
            title="One job, from arrival"
            highlight="to receipt"
            lead="Every feature follows the way a car moves through your garage, so learning the app is quick."
          />
        </Reveal>
        <JourneyStrip />
      </Section>

      {/* ----------------------------------------------------- explorer */}
      <Section tone="tinted" labelledBy="features-grid-title">
        <Reveal>
          <SectionHeading
            id="features-grid-title"
            eyebrow="The detail"
            title="What each part of the app"
            highlight="does for you"
            lead="Pick an area to see just those features, or browse them all."
          />
        </Reveal>

        <Reveal delay={150}>
          <div
            role="tablist"
            aria-label="Feature categories"
            className="mx-auto mt-10 flex max-w-4xl gap-2 overflow-x-auto pb-2 scrollbar-thin sm:flex-wrap sm:justify-center sm:overflow-visible"
          >
            {categories.map((category) => {
              const selected = category.id === active
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="features-grid"
                  onClick={() => setActive(category.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300',
                    selected
                      ? 'border-transparent bg-primary-900 text-white shadow-lg shadow-primary-900/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-800',
                  )}
                >
                  <category.icon className="h-4 w-4" aria-hidden="true" />
                  {category.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[11px] tabular-nums',
                      selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {countFor(category.id)}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <p
          key={`blurb-${active}`}
          aria-live="polite"
          className="animate-fade-in mt-4 text-center text-sm text-slate-500"
        >
          {activeCategory.blurb}
        </p>

        {/* Keyed on the tab, so the cards re-run their entrance on each switch. */}
        <div
          id="features-grid"
          role="tabpanel"
          key={active}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {shown.map((feature, i) => (
            <ShowcaseCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------ preview */}
      <Section labelledBy="features-preview-title">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal variant="left">
            <SectionHeading
              id="features-preview-title"
              align="left"
              eyebrow="See it in action"
              title="Your whole garage"
              highlight="on one screen"
              lead="Open the dashboard in the morning and see what came in, what is in the workshop, and what is still owed, before you ask anyone."
            />
            <ul className="mt-6 space-y-3">
              {[
                'Revenue collected this month and all time',
                'Pending vehicles and unpaid bills you cannot miss',
                'Click any figure to see the list behind it',
              ].map((line, i) => (
                <Reveal as="li" key={line} delay={200 + i * 120} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="text-sm text-slate-700">{line}</span>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={600} className="mt-8">
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Start free trial
                </Button>
              </Link>
            </Reveal>
          </Reveal>

          <Reveal variant="scale" delay={150} className="relative">
            <span
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary-200/60 via-transparent to-accent-200/60 blur-2xl"
            />
            <div className="animate-float">
              <DashboardPreview />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------- still building */}
      <Section tone="tinted" labelledBy="features-honest-title">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100"
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id="features-honest-title" className="flex items-center gap-2 text-lg font-bold text-primary-950">
                  What is still being built
                  <Info className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  GaragePilot is actively developed, and some screens are not finished yet: the
                  Billing and Salary pages, and saving changes on the garage profile. They are left off this page on purpose — you will see them in
                  the app marked as they are, rather than find out after signing up.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link to="/subscription">
                    <Button fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                      See Subscription
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button fullWidth variant="outline">
                      Ask us a question
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <CtaBand
        title="Try the whole app for a month"
        lead="The free trial opens every feature on this page. No card details, no commitment."
      />
    </>
  )
}
