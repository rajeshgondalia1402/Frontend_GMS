import {
  BadgeCheck,
  Car,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  MessageCircle,
  Users,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ShowcaseCopy {
  eyebrow: string
  title: string
  subtitle: string
}

const FEATURES = [
  { icon: ClipboardList, text: 'Job cards, estimates and bills in seconds' },
  { icon: Users, text: 'Every customer and vehicle history in one place' },
  { icon: MessageCircle, text: 'WhatsApp receipts and service reminders' },
]

/** One line of the sample job card. */
function JobLine({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="flex items-center gap-2 text-slate-600">
        <Wrench className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </span>
      <span className="font-semibold text-slate-800">{amount}</span>
    </div>
  )
}

/**
 * The left half of the sign-in / sign-up screens on desktop: what GaragePilot
 * is, shown with a sample job card rather than a stock photo. Decorative - the
 * card is an illustration of the product, not anyone's real data.
 */
export function AuthShowcase({ copy }: { copy: ShowcaseCopy }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-primary-950 px-10 py-10 text-white xl:px-14">
      {/* Blueprint grid + glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-500/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl" />

      {/* Logo */}
      <div className="relative">
        <span className="inline-flex rounded-xl bg-white px-3 py-2 shadow-lg shadow-black/20">
          <img src="/brand/garagepilot-logo.png" alt="GaragePilot — Smart Garage Management" className="block h-9 w-auto" />
        </span>
      </div>

      {/* Copy */}
      <div className="relative mt-10 max-w-lg">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-300">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          {copy.eyebrow}
        </p>
        <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight xl:text-[2.5rem]">{copy.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-primary-100/80">{copy.subtitle}</p>
      </div>

      {/* Product illustration - dropped on short screens so nothing is cut off */}
      <div className="relative mt-9 [@media(max-height:820px)]:hidden">
        <div className="relative mx-auto max-w-md xl:mx-0">
          {/* Job card */}
          <div className="animate-float rounded-2xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/40 ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Car className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-bold">Maruti Swift Dzire</p>
                  <p className="text-xs font-medium tracking-wide text-slate-500">GJ 01 AB 1234 · Petrol</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                In service
              </span>
            </div>

            <div className="mt-4 border-t border-dashed border-slate-200 pt-2">
              <JobLine label="Engine oil change" amount="₹1,250" />
              <JobLine label="Front brake pads" amount="₹1,450" />
              <JobLine label="Wheel alignment" amount="₹600" />
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-500">Job card JC-2026-0142</span>
              <span className="flex items-center text-base font-bold text-slate-900">
                <IndianRupee className="h-4 w-4" />
                3,300
              </span>
            </div>
          </div>

          {/* Payment toast */}
          <div className="absolute -bottom-6 -right-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-900 shadow-xl shadow-black/30 ring-1 ring-black/5 xl:-right-10">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Paid ₹3,300 · UPI</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MessageCircle className="h-3 w-3 text-emerald-500" /> Receipt sent on WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <ul className="relative mt-auto space-y-3 pt-12">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-primary-50/90">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
              <Icon className="h-4 w-4 text-accent-300" />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <div className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-primary-100/70">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        30-day free trial · No card required · Built for Indian garages
      </div>
    </div>
  )
}

/** The same message, compact, above the form on phones and tablets. */
export function AuthShowcaseCompact({ copy, className }: { copy: ShowcaseCopy; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-primary-950 px-5 pb-10 pt-6 text-white', className)}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-500/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary-500/30 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <span className="inline-flex rounded-lg bg-white px-2.5 py-1.5">
          <img src="/brand/garagepilot-logo.png" alt="GaragePilot — Smart Garage Management" className="block h-7 w-auto" />
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
          <Wrench className="h-4 w-4 text-accent-300" />
        </span>
      </div>
      <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-wider text-accent-300">{copy.eyebrow}</p>
      <p className="relative mt-1 text-xl font-bold leading-snug">{copy.title}</p>
    </div>
  )
}
