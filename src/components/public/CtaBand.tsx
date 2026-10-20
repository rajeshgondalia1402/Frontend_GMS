import { Link } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from '@/lib/publicContact'
import { HeroBackdrop } from './PageHero'

/**
 * The closing call to action. It offers the dashboard instead of a sign-up to
 * an owner who is already signed in, so the button is never an invitation to
 * create a second account.
 */
export function CtaBand({
  title = 'Start running your garage on GaragePilot',
  lead = 'Create your garage account, verify your mobile number and the free trial starts straight away.',
  secondary,
}: {
  title?: string
  lead?: string
  /** Replaces the default secondary link (Subscription). */
  secondary?: { label: string; to: string }
}) {
  const { isAuthenticated, initializing } = useAuth()
  const second = secondary ?? { label: 'See Subscription Plans', to: '/subscription' }

  return (
    <section aria-labelledby="final-cta" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand-navy px-5 py-12 text-center shadow-2xl shadow-primary-950/25 sm:px-10 sm:py-16">
          <HeroBackdrop />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="final-cta"
              className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-blue-100/80 sm:text-lg">{lead}</p>

            {!initializing && (
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
                      fullWidth
                      variant="accent"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                )}

                <Link to={second.to}>
                  <Button
                    size="lg"
                    fullWidth
                    variant="ghost"
                    className="border border-white/40 !text-white hover:!bg-white/10 focus-visible:ring-white"
                  >
                    {second.label}
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:gap-6">
              <a
                href={CONTACT_PHONE_HREF}
                className="inline-flex items-center gap-2 font-semibold text-white transition-colors hover:text-amber-300"
              >
                <Phone aria-hidden="true" className="h-4 w-4 text-amber-400" />
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={CONTACT_EMAIL_HREF}
                className="inline-flex min-w-0 items-center gap-2 [overflow-wrap:anywhere] font-semibold text-white transition-colors hover:text-amber-300"
              >
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-400" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
