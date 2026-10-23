import {
  BarChart3,
  CarFront,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  Users,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { WhatsappIcon } from '@/components/ui'
import type { Feature, FeatureIcon } from '@/components/public'

/**
 * What the public site says the product does.
 *
 * Every entry here describes a screen that exists and is wired to the API —
 * the modules the project README lists as integrated. Billing, Salary, the
 * platform admin panel and saving the garage profile still run on mock data,
 * so they are deliberately absent: the site must not sell a screen that does
 * not save.
 */
export const features: Feature[] = [
  {
    icon: Users,
    tone: 'primary',
    title: 'Customers & their vehicles',
    description:
      'Every customer with their contact details and their whole fleet — make, model, variant, type, fuel, colour, odometer reading and insurance expiry — kept together instead of in a diary.',
    points: [
      'Search by name or mobile number; sort by name, city or when they joined',
      "Each row unfolds the rest of the record underneath it",
      'Insurance within 30 days of expiry is flagged on the customer and the vehicle',
    ],
  },
  {
    icon: Wrench,
    tone: 'sky',
    title: 'Job cards from intake to delivery',
    description:
      'Open a card against a saved vehicle, write down the complaint, add the billable lines — services, parts and labour — assign the mechanic, and move it from pending to delivered.',
    points: [
      'The next job number is suggested as the form opens',
      'Customer type-ahead, then pick the vehicle from their fleet',
      'Turnaround counted in days, and flagged once a car sits past a week',
    ],
  },
  {
    icon: IndianRupee,
    tone: 'emerald',
    title: 'Part payments that settle the bill',
    description:
      'A bill is rarely settled in one go. Take part of it in cash now and the rest on UPI at collection — the card re-settles itself to partially paid, then paid, and marks the vehicle delivered once nothing is owed.',
    points: [
      'Every receipt against a bill, with the balance left after each one',
      'A receipt typed wrong can be corrected or cancelled',
      'More than the balance is refused before it is ever sent',
    ],
  },
  {
    icon: WhatsappIcon,
    tone: 'emerald',
    title: 'Receipts on WhatsApp',
    description:
      'Send any receipt to the customer on WhatsApp — the garage, the job card, the vehicle, what was taken and how, then the total, what was just paid and what is still owing. The chat opens with the message already typed; you press send.',
  },
  {
    icon: FileText,
    tone: 'violet',
    title: 'Invoice & sale receipt PDFs',
    description:
      'A bill that has been paid, in part or in full, downloads as an invoice PDF: your garage details, the customer, the vehicle in full, the complaint, every billed line, the totals with the balance due, and every receipt taken. Used car sales get a receipt PDF of their own.',
    points: ['Built in the browser — nothing to install', 'Long bills flow onto further pages'],
  },
  {
    icon: CarFront,
    tone: 'amber',
    title: 'Used car sales',
    description:
      'List the used cars you are selling with their papers — PUC, insurance and accident history marked valid, expired, missing or clean — then record who bought each one, what it actually went for, and what has been collected against it.',
    points: [
      'A car leaves the sale board the moment it is sold',
      'Collect the balance straight from the row',
      'A car paid for in full is marked delivered for you',
    ],
  },
  {
    icon: UsersRound,
    tone: 'rose',
    title: 'Staff register',
    description:
      'Who works at the garage, their category and role, mobile number, monthly salary, status and the day they joined — narrowed by category and status, searched from one box, and pickable as the mechanic on a job card.',
  },
  {
    icon: LayoutDashboard,
    tone: 'primary',
    title: 'A dashboard worth opening',
    description:
      'Nine figures in a single request: revenue all time and this month, new customers, vehicles and job cards, plus the ones that need attention — pending vehicles, cars in service, unpaid bills and part-paid bills.',
    points: [
      'Click a tile and its list opens underneath, five rows at a time',
      'Bills and pending vehicles are counted all time, not just this month',
      'Revenue is money collected, counted on the day it came in',
    ],
  },
  {
    icon: BarChart3,
    tone: 'sky',
    title: 'Charts and revenue reports',
    description:
      'Revenue collected and vehicles serviced, month by month, for this year and the four before it — with a popup behind every bar listing the month itself. Two revenue reports filter by date range, payment method or a search, and print.',
    points: [
      'Total collected, payment count, average and largest payment',
      'The split by payment method, as a bar and a row per method',
      'Clicking a payment opens its job card in a new tab',
    ],
  },
  {
    icon: FileSpreadsheet,
    tone: 'emerald',
    title: 'Excel export',
    description:
      'Customers, vehicles, car listings and car sales download as a real .xlsx — the search term and the order written into the sheet above a frozen header. Your data comes back out whenever you want it.',
  },
  {
    icon: Smartphone,
    tone: 'violet',
    title: 'Built for the phone at the counter',
    description:
      'Mobile-first throughout: tables become cards, the sidebar becomes a drawer with a bottom bar, and dialogs become bottom sheets. The same app on the desktop in the office and the phone on the shop floor.',
  },
  {
    icon: ShieldCheck,
    tone: 'amber',
    title: 'Verified sign-up, separate sessions',
    description:
      'Signing up verifies your mobile number with a 6-digit code before the account is created. You sign in with that number and your password, sessions expire on their own, and the platform admin holds a token entirely separate from yours.',
  },
]

/** The six on the home page; all twelve are on `/features`. */
export const homeFeatures = features.slice(0, 6)

export interface Benefit {
  icon: FeatureIcon
  title: string
  description: string
}

export const benefits: Benefit[] = [
  {
    icon: LayoutDashboard,
    title: 'One screen to open in the morning',
    description:
      'What came in, what is on the ramp, what is waiting and what is still owed — all of it before you have asked anyone anything.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing slips through',
    description:
      'Pending vehicles and unpaid bills are counted all time, not for the current month, so a bill from March is still in front of you in September.',
  },
  {
    icon: IndianRupee,
    title: 'Every rupee traced to a receipt',
    description:
      'Revenue is money actually collected, counted on the day it arrived, with the receipts behind each bill and who took them.',
  },
  {
    icon: FileText,
    title: 'Paperwork the customer keeps',
    description:
      'An invoice PDF for the file and a WhatsApp receipt for the phone, both out of the same job card you just billed.',
  },
  {
    icon: Smartphone,
    title: 'Works where the work happens',
    description:
      'The counter, the ramp and the office see the same app — there is no separate mobile version to keep in step.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Your data comes back out',
    description:
      'Any list downloads as a real Excel file, and every bill and sale prints as a PDF, so nothing is locked in.',
  },
]

export interface HowItWorksStep {
  title: string
  description: string
}

/**
 * The journey as the app actually runs it — registration, the OTP, login, then
 * the modules. Nothing here is a step the app does not ask for.
 */
export const howItWorks: HowItWorksStep[] = [
  {
    title: 'Create your garage account',
    description:
      'Owner name, mobile number, garage name, city and a password. Email is optional, and no card details are asked for.',
  },
  {
    title: 'Verify your mobile number',
    description:
      'A 6-digit code goes to the number you registered and is good for 5 minutes. The account is created once it checks out — and that number is how you sign in from then on.',
  },
  {
    title: 'Sign in and set up',
    description:
      'The free trial runs from the day the account was created, and the app shows the plan, its end date and the days remaining. Add your customers, their vehicles and your staff.',
  },
  {
    title: 'Run the day on job cards',
    description:
      'Open a card against a vehicle, bill the services, parts and labour, assign a mechanic, and update the status as the work moves.',
  },
  {
    title: 'Collect, receipt, and read the figures',
    description:
      'Take payment in parts or in full, send the receipt on WhatsApp, download the invoice — then read the month off the dashboard and the revenue reports.',
  },
]
