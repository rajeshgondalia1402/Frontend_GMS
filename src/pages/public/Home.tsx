import { Link } from 'react-router-dom'
import { ArrowRight, Check, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  BillPreview,
  CtaBand,
  DashboardPreview,
  FaqList,
  FeatureCard,
  PricingCards,
  Section,
  SectionHeading,
} from '@/components/public'
import type { FaqItem } from '@/components/public'
import { useAuth } from '@/context/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { benefits, homeFeatures, howItWorks } from '@/lib/publicContent'
import { MONTHLY_PRICE, YEARLY_PRICE, YEARLY_SAVING } from '@/lib/publicPlans'
import { formatCurrency } from '@/lib/utils'

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
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-white">
        {/* Two soft washes rather than an illustration — they give the hero
            depth without competing with the product shot. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-50/80 via-white to-white"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 top-40 h-64 w-64 rounded-full bg-accent-200/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                Smart Garage Management
              </p>

              <h1
                id="hero-title"
                className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
              >
                Manage your garage business smarter.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Customers, vehicles, job cards, part payments, invoices, used car sales and staff —
                in one app that tells you what came in today, what is still on the ramp and what is
                still owed.
              </p>

              {!initializing && (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {isAuthenticated ? (
                    <Link to="/app">
                      <Button size="lg" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/register">
                      <Button size="lg" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Start Free Trial
                      </Button>
                    </Link>
                  )}
                  <Link to="/features">
                    <Button size="lg" fullWidth variant="outline">
                      Explore Features
                    </Button>
                  </Link>
                </div>
              )}

              <ul className="mt-8 space-y-2">
                {heroPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pl-4">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- features */}
      <Section tone="tinted" labelledBy="features-title">
        <SectionHeading
          id="features-title"
          eyebrow="What you get"
          title="Everything the desk does, in one place"
          lead="Each of these is a screen in the app today — not a roadmap."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/features">
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              See all features
            </Button>
          </Link>
        </div>
      </Section>

      {/* ----------------------------------------------------------- benefits */}
      <Section labelledBy="benefits-title">
        <SectionHeading
          id="benefits-title"
          eyebrow="Why it helps"
          title="Less chasing, fewer notebooks"
          lead="The practical difference, once the garage is running on it."
        />

        <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
              >
                <benefit.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">{benefit.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
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
          title="From sign-up to your first invoice"
          lead="The same five steps the app takes you through — nothing extra."
        />

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {howItWorks.map((step, index) => (
            <li
              key={step.title}
              className="relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-slate-900">{step.title}</h3>
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
          title="The bill, and the money against it"
          lead="A job card carries its billed lines; the payment screen carries every receipt taken against them, the balance left, and a WhatsApp button per receipt."
        />

        <div className="mt-10">
          <BillPreview />
        </div>
      </Section>

      {/* ------------------------------------------------------- subscription */}
      <Section tone="tinted" labelledBy="pricing-title">
        <SectionHeading
          id="pricing-title"
          eyebrow="Subscription"
          title="One price, the whole app"
          lead={`Start free for a month. After that it is ${formatCurrency(
            MONTHLY_PRICE,
          )} a month or ${formatCurrency(YEARLY_PRICE)} a year.`}
        />

        <div className="mt-10">
          <PricingCards includes={false} />
        </div>

        <div className="mt-8 text-center">
          <Link to="/subscription">
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Compare plans in full
            </Button>
          </Link>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- faq */}
      <Section labelledBy="faq-title">
        <SectionHeading
          id="faq-title"
          eyebrow="FAQ"
          title="Questions garages ask first"
        />

        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList items={faqs} />
          <p className="mt-6 text-center text-sm text-slate-500">
            Something not covered here?{' '}
            <Link to="/contact" className="font-semibold text-primary-600 hover:text-primary-700">
              Get in touch
            </Link>
            .
          </p>
        </div>
      </Section>

      {/* ---------------------------------------------------------- final CTA */}
      <CtaBand />
    </>
  )
}
