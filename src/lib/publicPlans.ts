import type { SubscriptionPlan } from '@/types/admin'
import { formatCurrency } from '@/lib/utils'

/**
 * The plans the public site quotes.
 *
 * `code` is the API's own plan code (`src/types/admin.ts`), so the choice a
 * visitor makes on `/subscription` can be carried through registration and
 * read back inside the app without a second vocabulary for the same three
 * plans.
 */
export interface PublicPlan {
  code: SubscriptionPlan
  /** Slug used in the `?plan=` query the CTAs carry. */
  slug: 'trial' | 'monthly' | 'yearly'
  name: string
  price: number
  /** What the price buys — rendered after the amount. */
  period: string
  /** One line on who the plan suits. */
  tagline: string
  cta: string
  /** Extra line under the price, when there is something factual to add. */
  note?: string
  /**
   * How the note reads: `saving` is the money highlight and takes the logo's
   * orange, `reassurance` is a plain "nothing to worry about" line and stays
   * green — orange on "no card details asked for" looks like a warning.
   */
  noteTone?: 'saving' | 'reassurance'
  highlight?: boolean
}

export const MONTHLY_PRICE = 149
export const YEARLY_PRICE = 1499
/** 12 × ₹149 − ₹1,499. */
export const YEARLY_SAVING = MONTHLY_PRICE * 12 - YEARLY_PRICE

export const publicPlans: PublicPlan[] = [
  {
    code: 'FREE_TRIAL',
    slug: 'trial',
    name: 'Free Trial',
    price: 0,
    period: 'for 1 month',
    tagline: 'Set up your garage and run it for a month before you decide.',
    cta: 'Start Free Trial',
    note: 'No card details asked for at sign-up.',
    noteTone: 'reassurance',
  },
  {
    code: 'MONTHLY',
    slug: 'monthly',
    name: 'Premium Monthly',
    price: MONTHLY_PRICE,
    period: 'per month',
    tagline: 'Month-to-month, for a garage that wants to keep it short.',
    cta: 'Choose Monthly',
  },
  {
    code: 'YEARLY',
    slug: 'yearly',
    name: 'Premium Yearly',
    price: YEARLY_PRICE,
    period: 'per year',
    tagline: 'The same plan paid once a year instead of twelve times.',
    cta: 'Choose Yearly',
    note: `Saves ${formatCurrency(YEARLY_SAVING)} against ${formatCurrency(MONTHLY_PRICE)} × 12.`,
    noteTone: 'saving',
    highlight: true,
  },
]

/**
 * What a subscription covers.
 *
 * One list rather than one per plan: the app has no per-plan feature gating —
 * a plan sets how long the garage's access runs, not which screens it can
 * open — so quoting a different feature list against each price would be
 * inventing a difference that is not there.
 */
export const planIncludes: string[] = [
  'Customers, vehicles and their service history',
  'Job cards with billable lines and mechanic assignment',
  'Part payments, receipts and WhatsApp receipt sharing',
  'Invoice and sale-receipt PDFs',
  'Used car listings and sale records',
  'Staff register',
  'Dashboard figures, monthly charts and revenue reports',
  'Excel export on every list',
]

export function planBySlug(slug: string | null): PublicPlan | undefined {
  return publicPlans.find((plan) => plan.slug === slug)
}
