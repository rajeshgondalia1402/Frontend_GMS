import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  Cog,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Store,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  BillPreview,
  ContactCards,
  CtaBand,
  DashboardPreview,
  FaqList,
  FeatureCard,
  HeroBackdrop,
  PricingCards,
  Section,
  SectionHeading,
} from '@/components/public'
import type { FaqItem } from '@/components/public'
import { useAuth } from '@/context/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { benefits, features, homeFeatures, howItWorks } from '@/lib/publicContent'
import { MONTHLY_PRICE, YEARLY_PRICE, YEARLY_SAVING } from '@/lib/publicPlans'
import { cn, formatCurrency } from '@/lib/utils'

/** Product facts for the strip under the hero — each one true of the app today. */
const stats = [
  { value: '₹0', label: 'for the first month' },
  { value: formatCurrency(MONTHLY_PRICE), label: 'a month after that' },
  { value: String(features.length), label: 'modules live in the app' },
  { value: '0', label: 'things to install' },
]

/** The kinds of workshop the app is laid out for. */
const workshops = [
  { icon: Wrench, label: 'Independent garages' },
  { icon: Cog, label: 'Multi-brand workshops' },
  { icon: Store, label: 'Service centres' },
  { icon: CarFront, label: 'Used car dealers' },
]

/** The three moments the bill preview is about. */
const billPoints = [
  { icon: IndianRupee, text: 'Cash now, UPI at collection' },
  { icon: FileText, text: 'Invoice PDF in one click' },
  { icon: BadgeCheck, text: 'Marked delivered once paid' },
]

/** Three short facts about the product, under the hero buttons. */
const heroPoints = [
  '1 month free, no card details',
  'Sign in with your mobile number',
  'Works on the phone and the desktop',
]

/**
 * Answers taken from how the app actually behaves — the registration and OTP
 * flow, the subscription dates on the account, and what the Subscription
 * screen inside the app does and does not do today.
 */
const faqs: FaqItem[] = [
  {
    question: 'Is there really a free trial?',
    answer:
      'Yes — ₹0 for 1 month. It starts the day your garage account is created, and the app shows the plan, its end date and the days remaining on the dashboard and in the top bar.',
  },
  {
    question: 'Do I have to enter card details to start?',
    answer:
      'No. Registration asks for your name, mobile number, garage name, city and a password — email is optional. The app never asks for card or bank details anywhere.',
  },
  {
    question: 'What does it cost after the trial?',
    answer: `${formatCurrency(MONTHLY_PRICE)} a month, or ${formatCurrency(
      YEARLY_PRICE,
    )} a year — which is ${formatCurrency(
      YEARLY_SAVING,
    )} less than paying monthly for twelve months. Both plans open exactly the same app; the plan sets how long your access runs, not which screens you get.`,
  },
  {
    question: 'How do I pay for a paid plan?',
    answer: (
      <>
        Every account starts on the free trial, and Monthly and Yearly are picked on the
        Subscription screen inside the app. Online checkout is not part of the app yet, so we say
        so rather than taking you to a payment page that does not exist — the{' '}
        <Link to="/subscription" className="font-medium text-primary-600 hover:text-primary-700">
          Subscription page
        </Link>{' '}
        sets out exactly how it works today.
      </>
    ),
  },
  {
    question: 'How do I sign in?',
    answer:
      'With the mobile number you registered and your password. The number is verified by a 6-digit code at sign-up and is your login identifier from then on, so it cannot be changed from the profile screen. If you forget your password, Forgot Password sends a fresh code to that number.',
  },
  {
    question: 'Is anything installed on my computer?',
    answer:
      'No. GaragePilot runs in the browser, and the invoice PDFs and Excel files are built in the browser too, so there is nothing to install for those either.',
  },
  {
    question: 'Can more than one person use it at the same time?',
    answer:
      'Yes — the garage account is signed in on as many devices as you need, and the app is built for two desks working at once: job numbers are checked at save time rather than reserved, and payments are checked against the live receipts, not against what a screen was showing.',
  },
  {
    question: 'Can I get my data out?',
    answer:
      'Customers, vehicles, car listings and car sales download as a real Excel file, each bill downloads as an invoice PDF, and each car sale as a receipt PDF.',
  },
]

export function Home() {
  usePageMeta({
    title: 'GaragePilot — Garage Management Software for Workshops in India',
    description:
      'Run your garage on one app: customers and vehicles, job cards, part payments and receipts, invoice PDFs, used car sales, staff and live revenue reports. Free for 1 month, then ₹149/month.',
  })

  const { isAuthenticated, initializing } = useAuth()

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden bg-brand-navy text-white"
      >
        <HeroBackdrop />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:pb-32 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 backdrop-blur">
                <Wrench aria-hidden="true" className="h-3.5 w-3.5" />
                Smart Garage Management
              </p>

              <h1
                id="hero-title"
                className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              >
                Run your garage <span className="text-brand-flame">at full speed.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-blue-100/80 sm:text-lg lg:mx-0">
                Customers, vehicles, job cards, part payments, invoices, used car sales and staff —
                in one app that tells you what came in today, what is still on the ramp and what is
                still owed.
              </p>

              {!initializing && (
                <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
                  {isAuthenticated ? (
                    <Link to="/app">
                      <Button
                        size="lg"
                        variant="accent"
                        fullWidth
                        leftIcon={<LayoutDashboard className="h-4 w-4" />}
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/register">
                      <Button
                        size="lg"
                        variant="accent"
                        fullWidth
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  )}
                  <Link to="/features">
                    <Button
                      size="lg"
                      fullWidth
                      variant="ghost"
                      className="border border-white/30 !text-white hover:!bg-white/10 focus-visible:ring-white"
                    >
                      Explore Features
                    </Button>
                  </Link>
                </div>
              )}

              <ul className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 lg:justify-start">
                {heroPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-blue-100/90">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-xl sm:mb-12 sm:mt-6 lg:mt-0 lg:max-w-none">
              <div className="animate-float">
                <DashboardPreview />
              </div>

              {/* Two floating chips — the moments the app is built around.
                  Illustrative, like the figures in the preview itself. */}
              <div
                aria-hidden="true"
                className="absolute -top-7 right-4 hidden items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-slate-900 shadow-xl shadow-primary-950/30 sm:flex lg:-right-6"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <span className="text-left">
                  <span className="block text-[11px] text-slate-500">Payment received</span>
                  <span className="block text-sm font-bold">₹7,400 · UPI</span>
                </span>
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-16 left-4 hidden items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-slate-900 shadow-xl shadow-primary-950/30 sm:flex lg:-left-6"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <span className="text-left">
                  <span className="block text-[11px] text-slate-500">Job card JC-2026-0112</span>
                  <span className="block text-sm font-bold">Vehicle delivered</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="bg-hazard absolute inset-x-0 bottom-0 h-1.5 opacity-90" />
      </section>

      {/* -------------------------------------------------------------- stats */}
      <section aria-label="GaragePilot at a glance" className="relative z-10 -mt-12 sm:-mt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-primary-950/10 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  'flex flex-col-reverse items-center justify-center px-3 py-5 text-center sm:py-6',
                  index % 2 === 1 && 'border-l border-slate-100',
                  index >= 2 && 'border-t border-slate-100 lg:border-t-0',
                  index === 2 && 'lg:border-l',
                )}
              >
                <dt className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{stat.label}</dt>
                <dd className="text-brand-flame text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------- workshops */}
      <section aria-label="Who GaragePilot is for" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Built for every kind of workshop
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
            {workshops.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-primary-900 sm:px-4 sm:text-sm"
              >
                <item.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-500" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- features */}
      <Section labelledBy="features-title">
        <SectionHeading
          id="features-title"
          eyebrow="What you get"
          title="Everything the service desk does,"
          highlight="in one place"
          lead="Each of these is a screen in the app today — not a roadmap."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {homeFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/features">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              See all {features.length} features
            </Button>
          </Link>
        </div>
      </Section>

      {/* ----------------------------------------------------------- benefits */}
      <Section tone="navy" labelledBy="benefits-title">
        <SectionHeading
          id="benefits-title"
          tone="light"
          eyebrow="Why it helps"
          title="Less chasing,"
          highlight="fewer notebooks"
          lead="The practical difference, once the garage is running on it."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-colors hover:border-amber-300/40 hover:bg-white/[0.08]"
            >
              <span
                aria-hidden="true"
                className="bg-brand-flame flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-950 shadow-lg shadow-accent-500/20"
              >
                <benefit.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">{benefit.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-blue-100/75">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- how it works */}
      <Section tone="tinted" labelledBy="how-title">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From sign-up to your"
          highlight="first invoice"
          lead="The same five steps the app takes you through — nothing extra."
        />

        <ol className="relative mt-14 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {/* The road between the steps, on desktop where they sit in a row. */}
          <span
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-7 hidden h-[3px] rounded-full bg-gradient-to-r from-primary-600 via-accent-500 to-amber-400 lg:block"
          />
          {howItWorks.map((step, index) => (
            <li
              key={step.title}
              className="relative flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white px-5 pb-5 text-center shadow-card lg:border-0 lg:bg-transparent lg:px-2 lg:shadow-none"
            >
              <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-lg font-extrabold text-amber-300 shadow-lg shadow-primary-900/30 ring-4 ring-white lg:mt-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-sm font-bold text-primary-950">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------ product preview */}
      <Section labelledBy="preview-title">
        <SectionHeading
          id="preview-title"
          eyebrow="A closer look"
          title="The bill, and"
          highlight="the money against it"
          lead="A job card carries its billed lines; the payment screen carries every receipt taken against them, the balance left, and a WhatsApp button per receipt."
        />

        <div className="mt-12">
          <BillPreview />
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
          {billPoints.map((item) => (
            <li
              key={item.text}
              className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-900"
            >
              <item.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-500" />
              {item.text}
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------- subscription */}
      <Section tone="tinted" labelledBy="pricing-title">
        <SectionHeading
          id="pricing-title"
          eyebrow="Subscription"
          title="One price,"
          highlight="the whole app"
          lead={`Start free for a month. After that it is ${formatCurrency(
            MONTHLY_PRICE,
          )} a month or ${formatCurrency(YEARLY_PRICE)} a year.`}
        />

        <div className="mt-14">
          <PricingCards includes={false} />
        </div>

        <div className="mt-10 text-center">
          <Link to="/subscription">
            <Button
              variant="outline"
              className="!border-primary-200 !text-primary-800 hover:!bg-primary-50"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Compare plans in full
            </Button>
          </Link>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- faq */}
      <Section labelledBy="faq-title">
        <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions garages" highlight="ask first" />

        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList items={faqs} />
        </div>
      </Section>

      {/* ------------------------------------------------------------ contact */}
      <Section tone="tinted" labelledBy="talk-title">
        <SectionHeading
          id="talk-title"
          eyebrow="Talk to us"
          title="Questions about your garage?"
          highlight="Just ask."
          lead="Call, email or WhatsApp — whichever is quickest from where you are standing."
        />
        <ContactCards className="mt-10" />
        <p className="mt-6 text-center text-sm text-slate-500">
          Prefer to write it all down?{' '}
          <Link to="/contact" className="font-semibold text-primary-600 hover:text-primary-700">
            Use the contact page
          </Link>
          .
        </p>
      </Section>

      {/* ---------------------------------------------------------- final CTA */}
      <CtaBand />
    </>
  )
}
