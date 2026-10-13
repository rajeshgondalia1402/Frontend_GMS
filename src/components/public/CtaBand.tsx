import { Link } from 'react-router-dom'
import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

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
    <section aria-labelledby="final-cta" className="bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary-600 px-5 py-12 text-center sm:px-10 sm:py-14">
          {/* A single soft highlight, so the band has depth without becoming
              the loudest thing on the page. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 id="final-cta" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-primary-50">{lead}</p>

            {!initializing && (
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                {isAuthenticated ? (
                  <Link to="/app">
                    <Button
                      size="lg"
                      className="!bg-accent-500 !text-primary-950 font-semibold shadow-sm hover:!bg-accent-400 focus-visible:ring-white"
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
                      className="!bg-accent-500 !text-primary-950 font-semibold shadow-sm hover:!bg-accent-400 focus-visible:ring-white"
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
          </div>
        </div>
      </div>
    </section>
  )
}
