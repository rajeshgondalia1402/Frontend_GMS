import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  CtaBand,
  DashboardPreview,
  FeatureCard,
  PageHero,
  Section,
  SectionHeading,
} from '@/components/public'
import { usePageMeta } from '@/hooks/usePageMeta'
import { features } from '@/lib/publicContent'

export function Features() {
  usePageMeta({
    title: 'Features — GaragePilot Garage Management Software',
    description:
      'Job cards, part payments and receipts, invoice PDFs, WhatsApp receipts, customers and vehicles, used car sales, staff, dashboard figures, revenue reports and Excel export — every feature in GaragePilot today.',
    type: 'article',
  })

  return (
    <>
      <PageHero
        id="features-page-title"
        eyebrow="Features"
        title="Every tool your workshop needs,"
        highlight="in one app"
        lead={`${features.length} capabilities, all of them live in the app today. Where something is still being built, it is not on this page.`}
      >
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-100/90 backdrop-blur"
            >
              {feature.title}
            </li>
          ))}
        </ul>
      </PageHero>

      <section aria-label="Dashboard preview" className="relative z-10 -mt-6 bg-transparent">
        <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
          <DashboardPreview />
        </div>
      </section>

      <Section labelledBy="features-grid-title">
        <SectionHeading
          id="features-grid-title"
          eyebrow="The detail"
          title="What each part of the app"
          highlight="does for you"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section tone="tinted" labelledBy="features-honest-title">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100"
            >
              <Info className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="features-honest-title" className="text-lg font-bold text-primary-950">
                What is still being built
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                GaragePilot is actively developed, and some screens are not finished yet: the Billing
                and Salary pages, saving changes on the garage profile, and paying for a
                subscription online. They are left off this page on purpose — you will see them in
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
      </Section>

      <CtaBand
        title="Try the whole app for a month"
        lead="The free trial opens every feature on this page. No card details, no commitment."
      />
    </>
  )
}
