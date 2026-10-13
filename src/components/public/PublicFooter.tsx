import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'

const FOOTER_LINK =
  'inline-block rounded py-1.5 text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'

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
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Create Garage Account', to: '/register' },
      { label: 'Forgot Password', to: '/forgot-password' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <BrandMark tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Garage management software for workshops in India — customers, job cards, payments,
              used car sales and the figures behind them, on one screen.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold text-white">{column.heading}</h2>
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
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} GaragePilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
