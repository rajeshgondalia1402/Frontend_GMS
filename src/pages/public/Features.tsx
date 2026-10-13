import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  CtaBand,
  DashboardPreview,
  FeatureCard,
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
      <Section labelledBy="features-page-title" className="bg-gradient-to-b from-primary-50/70 to-white">
        <SectionHeading
          id="features-page-title"
          level={1}
          eyebrow="Features"
          title="Every screen in GaragePilot today"
          lead="Twelve capabilities, all of them live in the app. Where something is still being built, it is not on this page."
        />

        <div className="mx-auto mt-10 max-w-4xl">
          <DashboardPreview />
        </div>
      </Section>

      <Section tone="tinted" labelledBy="features-grid-title">
        <SectionHeading
          id="features-grid-title"
          eyebrow="The detail"
          title="What each part of the app does"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section labelledBy="features-honest-title">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"
            >
              <Info className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="features-honest-title" className="text-base font-semibold text-slate-900">
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
                  <Button fullWidth variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    See Subscription
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button fullWidth variant="ghost">
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
