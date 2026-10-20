import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  Smartphone,
  Target,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { ContactCards, CtaBand, PageHero, Section, SectionHeading } from '@/components/public'
import { usePageMeta } from '@/hooks/usePageMeta'

/**
 * Each principle is tied to a decision that is visible in the product, so the
 * page describes how GaragePilot is actually built rather than making claims
 * about a company.
 */
const principles = [
  {
    icon: Smartphone,
    title: 'The phone is the main screen',
    description:
      'Every list becomes cards, every dialog becomes a bottom sheet, and the menu becomes a drawer with a bottom bar. The app is laid out for a phone held at the counter first and widened from there — not shrunk down from a desktop design.',
  },
  {
    icon: Target,
    title: 'Figures have to agree with each other',
    description:
      'A tile, the list behind it and the report that covers it are all counted the same way by the server, so the dashboard and the report never tell you two different numbers. Trial days count calendar days, so the number drops at midnight rather than at whatever time you happened to sign up.',
  },
  {
    icon: CheckCircle2,
    title: 'The app says what it cannot do',
    description:
      'A payment larger than the balance is refused and names what is actually left. A sale already recorded is refused and says so. An unfinished screen is marked, not disguised — which is also why the Billing and Salary pages are missing from our feature list.',
  },
  {
    icon: FileSpreadsheet,
    title: 'No lock-in, no bloat',
    description:
      'Invoices, sale receipts and Excel exports are all generated in the browser without a single extra library, so files come out of the app whenever you want them and pages stay quick on an ordinary shop computer.',
  },
  {
    icon: ShieldCheck,
    title: 'One garage, one account, kept apart',
    description:
      'Your mobile number is verified before an account exists, sessions expire on their own, and the platform administrator signs in with a completely separate token that is never sent to a garage endpoint or the other way round.',
  },
  {
    icon: Wrench,
    title: 'Built around the job card',
    description:
      'The job card is what a garage actually works from, so everything hangs off it: the vehicle, the customer, the mechanic, the billed lines, the receipts, the invoice and the figures on the dashboard.',
  },
]

const audience = [
  'Independent garages and multi-brand workshops',
  'Service centres billing parts, labour and services on one card',
  'Workshops that also buy and sell used cars',
  'Owners who want the day’s figures without doing a reconciliation',
]

export function About() {
  usePageMeta({
    title: 'About GaragePilot — Garage Management Software',
    description:
      'GaragePilot is garage management software built around the job card: customers and vehicles, billing, part payments, used car sales and live revenue figures, designed mobile-first for Indian workshops.',
    type: 'article',
  })

  return (
    <>
      <PageHero
        id="about-title"
        eyebrow="About us"
        title="Software that fits how a garage"
        highlight="actually runs"
        lead="GaragePilot is a garage management app built around the one document a workshop already lives by — the job card — and everything a garage has to do with it afterwards."
      />

      <Section labelledBy="why-title">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-accent-600">
              <span aria-hidden="true" className="h-[2px] w-8 rounded-full bg-accent-500" />
              Our story
            </p>
            <h2
              id="why-title"
              className="mt-3 text-2xl font-extrabold tracking-tight text-primary-950 sm:text-3xl"
            >
              Why we <span className="text-brand-flame">built it</span>
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-600">
              <p>
                Most workshops keep their work in three places at once: a diary for the vehicles in
                today, a notebook for who owes what, and the owner’s memory for everything else.
                It holds up until a customer calls about a bill from two months ago, or until
                someone has to work out what the garage actually collected last month.
              </p>
              <p>
                GaragePilot puts those three places into one. A vehicle comes in, a job card is
                opened against it, the parts and labour are billed on it, the money is taken against
                it in as many parts as the customer needs, and the receipt goes to their WhatsApp.
                By the end of the month, the revenue figure on the dashboard is simply the sum of
                the receipts you took — not an estimate anybody had to assemble.
              </p>
              <p>
                It also covers the side of the business most garage software ignores: the used cars
                sitting on the forecourt, their papers, who bought them, what they went for, and
                what is still to be collected.
              </p>
            </div>
          </div>

          <div className="relative isolate self-start overflow-hidden rounded-2xl bg-brand-navy p-6 text-white shadow-xl shadow-primary-950/20 sm:p-8">
            <div aria-hidden="true" className="bg-hazard absolute inset-x-0 top-0 h-1.5" />
            <h2 className="text-lg font-bold text-amber-300">Who it is for</h2>
            <ul className="mt-4 space-y-3">
              {audience.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-blue-50">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-relaxed text-blue-100/80">
              One garage account covers the whole workshop — sign in on the office desktop and on
              the phones at the counter at the same time.
            </p>

            <div className="mt-5">
              <Link to="/features">
                <Button fullWidth variant="accent">
                  See what is in the app
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="tinted" labelledBy="principles-title">
        <SectionHeading
          id="principles-title"
          eyebrow="How we build"
          title="The decisions behind"
          highlight="the product"
          lead="Each of these is something you can check for yourself inside the app."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {principles.map((principle, index) => (
            <article
              key={principle.title}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/10 sm:p-6"
            >
              <span
                aria-hidden="true"
                className="absolute right-4 top-3 text-5xl font-extrabold text-slate-100 transition-colors group-hover:text-accent-100"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                aria-hidden="true"
                className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy text-amber-300 shadow-md shadow-primary-900/20"
              >
                <principle.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-4 text-base font-bold text-primary-950">{principle.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {principle.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section labelledBy="status-title">
        <div className="mx-auto max-w-3xl rounded-2xl border-l-4 border-accent-500 bg-white p-6 shadow-xl shadow-primary-900/5 ring-1 ring-slate-200 sm:p-8">
          <h2 id="status-title" className="text-xl font-extrabold tracking-tight text-primary-950">
            Where the product stands
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            GaragePilot is in active development and we would rather tell you that than imply it is
            finished. Customers, vehicles, job cards, payments and receipts, invoice and sale
            receipt PDFs, used car sales, staff, the dashboard and the revenue reports are all live
            and saving to the server. The Billing and Salary pages, saving edits to the garage
            profile, and paying for a subscription online are still being built — and until they
            are, they are not on our feature list or in our pricing.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/subscription">
              <Button fullWidth>See Subscription</Button>
            </Link>
            <Link to="/contact">
              <Button fullWidth variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Section tone="tinted" labelledBy="about-contact-title">
        <SectionHeading
          id="about-contact-title"
          eyebrow="Get in touch"
          title="We would love to hear"
          highlight="about your garage"
          lead="Reach the GaragePilot team directly — by phone, email or WhatsApp."
        />
        <ContactCards className="mt-10" />
      </Section>

      <CtaBand
        title="See whether it fits your garage"
        lead="A month of free trial, with every live feature open. No card details are asked for."
        secondary={{ label: 'Contact Us', to: '/contact' }}
      />
    </>
  )
}
