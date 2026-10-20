import type { ComponentType } from 'react'
import { ArrowUpRight, Mail, Phone } from 'lucide-react'
import { WhatsappIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/publicContact'

interface Channel {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  note: string
  href: string
  external?: boolean
  tone: string
}

const channels: Channel[] = [
  {
    icon: Phone,
    label: 'Call us',
    value: CONTACT_PHONE_DISPLAY,
    note: 'Talk to us about your garage, the trial or a plan.',
    href: CONTACT_PHONE_HREF,
    tone: 'from-primary-600 to-primary-800 text-white',
  },
  {
    icon: Mail,
    label: 'Email us',
    value: CONTACT_EMAIL,
    note: 'Send the details and we will write back.',
    href: CONTACT_EMAIL_HREF,
    tone: 'from-accent-500 to-amber-400 text-primary-950',
  },
  {
    icon: WhatsappIcon,
    label: 'WhatsApp',
    value: CONTACT_PHONE_DISPLAY,
    note: 'Message us from the phone at the counter.',
    href: CONTACT_WHATSAPP_HREF,
    external: true,
    tone: 'from-emerald-500 to-emerald-600 text-white',
  },
]

/** Phone, email and WhatsApp — each a single tap away on a phone. */
export function ContactCards({ className }: { className?: string }) {
  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5', className)}>
      {channels.map((channel) => (
        <li key={channel.label} className="min-w-0">
          <a
            href={channel.href}
            {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="group relative flex h-full flex-col items-start gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
                channel.tone,
              )}
            >
              <channel.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 w-full">
              <span className="block text-xs font-bold uppercase tracking-wider text-accent-600">
                {channel.label}
              </span>
              <span className="mt-1 block text-base font-bold text-primary-950 [overflow-wrap:anywhere]">
                {channel.value}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                {channel.note}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="absolute right-5 top-5 h-5 w-5 text-slate-300 transition-colors group-hover:text-accent-500"
            />
          </a>
        </li>
      ))}
    </ul>
  )
}
