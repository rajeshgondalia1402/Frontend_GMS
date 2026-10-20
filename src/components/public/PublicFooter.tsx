import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { WhatsappIcon } from '@/components/ui'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/publicContact'
import { BrandMark } from './BrandMark'

const FOOTER_LINK =
  'inline-block rounded py-1.5 text-sm text-blue-100/70 transition-colors hover:text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300'

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Subscription', to: '/subscription' },
      { label: 'Start Free Trial', to: '/register' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Login', to: '/login' },
      { label: 'Forgot Password', to: '/forgot-password' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-primary-950 text-white">
      <div aria-hidden="true" className="bg-hazard h-1.5" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-10 -z-10 h-80 w-80 rounded-full bg-primary-600/20 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr]">
          <div>
            <BrandMark tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-blue-100/70">
              Garage management software for workshops in India — customers, job cards, payments,
              used car sales and the figures behind them, on one screen.
            </p>
            <a
              href={CONTACT_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <WhatsappIcon className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                {column.heading}
              </h2>
              <ul className="mt-3 space-y-0.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className={FOOTER_LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Get in touch
            </h2>
            <ul className="mt-4 space-y-3.5 text-sm">
              <li>
                <a
                  href={CONTACT_PHONE_HREF}
                  className="group flex items-start gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-300 transition-colors group-hover:bg-accent-500 group-hover:text-primary-950">
                    <Phone aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-blue-100/60">Call us</span>
                    <span className="font-semibold text-white">{CONTACT_PHONE_DISPLAY}</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_EMAIL_HREF}
                  className="group flex items-start gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-300 transition-colors group-hover:bg-accent-500 group-hover:text-primary-950">
                    <Mail aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-blue-100/60">Email us</span>
                    <span className="block [overflow-wrap:anywhere] font-semibold text-white">
                      {CONTACT_EMAIL}
                    </span>
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-300">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-blue-100/60">Serving</span>
                  <span className="font-semibold text-white">Garages across India</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-blue-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GaragePilot. All rights reserved.</p>
          <p>Smart Garage Management, made for Indian workshops.</p>
        </div>
      </div>
    </footer>
  )
}
