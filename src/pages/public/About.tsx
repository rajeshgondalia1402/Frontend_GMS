import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  NotebookPen,
  ShieldCheck,
  Smartphone,
  Target,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  ContactCards,
  CtaBand,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  useInView,
} from '@/components/public'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/lib/utils'

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

/** The three places a workshop keeps its work today — from "Our story". */
const scattered = [
  { icon: BookOpen, label: 'A diary', text: 'for the vehicles in today' },
  { icon: NotebookPen, label: 'A notebook', text: 'for who owes what' },
  { icon: Brain, label: 'The owner’s memory', text: 'for everything else' },
]

/** The job card's journey, exactly as "Our story" describes it. */
const flow = [
  'A vehicle comes in',
  'A job card is opened against it',
  'Parts and labour are billed on it',
  'Money is taken in as many parts as needed',
  'The receipt goes to their WhatsApp',
]

const live = [
  'Customers',
  'Vehicles',
  'Job cards',
  'Payments and receipts',
  'Invoice and sale receipt PDFs',
  'Used car sales',
  'Staff',
  'The dashboard',
  'Revenue reports',
]

const building = ['Billing page', 'Salary page', 'Saving edits to the garage profile']

/* ------------------------------------------------------- three-into-one */

function ThreeIntoOne() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)

  return (
    <div ref={ref} className="relative">
      <div className="grid gap-3 sm:grid-cols-3">
        {scattered.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              'rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center transition-all duration-700 motion-reduce:transition-none',
              inView ? 'translate-y-0 rotate-0 opacity-100' : 'translate-y-6 opacity-0',
              inView && i === 0 && 'sm:-rotate-2',
              inView && i === 2 && 'sm:rotate-2',
            )}
            style={{ transitionDelay: `${i * 180}ms` }}
          >
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-800">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.text}</p>
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'mx-auto my-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-flame text-white shadow-lg transition-all duration-700 motion-reduce:transition-none',
          inView ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        )}
        style={{ transitionDelay: '650ms' }}
      >
        <ChevronDown className="h-5 w-5" />
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-brand-navy p-5 text-white shadow-xl shadow-primary-900/20 transition-all duration-700 motion-reduce:transition-none sm:p-6',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        )}
        style={{ transitionDelay: '850ms' }}
      >
        <div aria-hidden="true" className="bg-hazard absolute inset-x-0 top-0 h-1.5" />
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">GaragePilot puts them into one</p>
        <ol className="mt-4 space-y-2.5">
          {flow.map((step, i) => (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 text-sm text-blue-50 transition-all duration-500 motion-reduce:transition-none',
                inView ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0',
              )}
              style={{ transitionDelay: `${1050 + i * 140}ms` }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-amber-300 ring-1 ring-white/15">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- page */

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
      >
        <Reveal delay={200} variant="scale" className="mt-8 flex justify-center">
          <a
            href="#why-title"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-100/80 transition-colors hover:text-white"
          >
            Read our story
            <ChevronDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
          </a>
        </Reveal>
      </PageHero>

      {/* -------------------------------------------------------- story */}
      <Section labelledBy="why-title">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal variant="left">
            <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-accent-600">
              <span aria-hidden="true" className="h-[2px] w-8 rounded-full bg-accent-500" />
              Our story
            </p>
            <h2
              id="why-title"
              className="mt-3 scroll-mt-28 text-2xl font-extrabold tracking-tight text-primary-950 sm:text-3xl"
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
          </Reveal>

          <ThreeIntoOne />
        </div>
      </Section>

      {/* ------------------------------------------------------ audience */}
      <Section tone="navy" labelledBy="audience-title">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal variant="left">
            <SectionHeading
              id="audience-title"
              align="left"
              tone="light"
              eyebrow="Who it is for"
              title="Made for"
              highlight="workshops"
              lead="One garage account covers the whole workshop — sign in on the office desktop and on the phones at the counter at the same time."
            />
          </Reveal>

          <ul className="grid gap-3 sm:grid-cols-2">
            {audience.map((item, i) => (
              <Reveal as="li" key={item} delay={i * 130} variant="scale">
                <div className="group flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:bg-white/10">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-400 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="text-sm leading-relaxed text-blue-50">{item}</span>
                </div>
              </Reveal>
            ))}
            <Reveal as="li" delay={audience.length * 130} className="sm:col-span-2">
              <Link to="/features">
                <Button fullWidth variant="accent" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  See what is in the app
                </Button>
              </Link>
            </Reveal>
          </ul>
        </div>
      </Section>

      {/* ---------------------------------------------------- principles */}
      <Section tone="tinted" labelledBy="principles-title">
        <Reveal>
          <SectionHeading
            id="principles-title"
            eyebrow="How we build"
            title="The decisions behind"
            highlight="the product"
            lead="Each of these is something you can check for yourself inside the app."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {principles.map((principle, index) => (
            <Reveal key={principle.title} delay={(index % 3) * 140} className="h-full">
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-900/10">
                <span
                  aria-hidden="true"
                  className="bg-brand-flame absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary-100/60 blur-2xl transition-transform duration-500 group-hover:scale-150"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-4 text-5xl font-black text-slate-100 transition-colors duration-300 group-hover:text-accent-100"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  aria-hidden="true"
                  className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy text-amber-300 shadow-lg shadow-primary-900/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                >
                  <principle.icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-5 text-base font-bold text-primary-950">{principle.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                  {principle.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- status */}
      <Section labelledBy="status-title">
        <Reveal>
          <SectionHeading
            id="status-title"
            eyebrow="Honest status"
            title="Where the product"
            highlight="stands"
            lead="GaragePilot is in active development and we would rather tell you that than imply it is finished."
          />
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-[1.4fr_1fr]">
          <Reveal variant="left" className="h-full">
            <div className="h-full rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-card">
              <h3 className="flex items-center gap-2 text-base font-bold text-emerald-800">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Live and saving to the server
              </h3>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {live.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal variant="scale" delay={150} className="h-full">
            <div className="h-full rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-card">
              <h3 className="flex items-center gap-2 text-base font-bold text-amber-800">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Still being built
              </h3>
              <ul className="mt-4 space-y-2.5">
                {building.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-amber-100 pt-4 text-xs leading-relaxed text-slate-500">
                Until they are finished, they are not on our feature list or in our pricing.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={250}>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <Link to="/subscription" className="flex-1">
              <Button fullWidth>See Subscription</Button>
            </Link>
            <Link to="/contact" className="flex-1">
              <Button fullWidth variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------- contact */}
      <Section tone="tinted" labelledBy="about-contact-title">
        <Reveal>
          <SectionHeading
            id="about-contact-title"
            eyebrow="Get in touch"
            title="We would love to hear"
            highlight="about your garage"
            lead="Reach the GaragePilot team directly — by phone, email or WhatsApp."
          />
        </Reveal>
        <Reveal delay={150}>
          <ContactCards className="mt-10" />
        </Reveal>
      </Section>

      <CtaBand
        title="See whether it fits your garage"
        lead="A month of free trial, with every live feature open. No card details are asked for."
        secondary={{ label: 'Contact Us', to: '/contact' }}
      />
    </>
  )
}
