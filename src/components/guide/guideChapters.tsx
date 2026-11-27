import type { ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Car,
  CarFront,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  Info,
  KeyRound,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Phone,
  Plus,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  In,
  MockBadge,
  MockButton,
  MockCard,
  MockChip,
  MockField,
  MockScreen,
  MockSteps,
  Tap,
  Typed,
  useAfter,
} from './GuideMock'

export interface GuideStep {
  /** Short headline under the phone. */
  title: string
  /** One or two plain sentences — also what "Read aloud" speaks. */
  say: string
  /** How long the clip plays before the next one, in ms. */
  ms?: number
  screen: () => ReactNode
}

export interface GuideChapter {
  /** Used in the link: /guide?c=<id>. */
  id: string
  title: string
  icon: LucideIcon
  /** One line for the chapter list. */
  blurb: string
  steps: GuideStep[]
}

const STEPS_FLOW = ['Customer', 'Vehicle', 'Done']

/* --------------------------------------------------------------- pieces */

function BottomMenu({ active }: { active: string }) {
  const items: [string, LucideIcon][] = [
    ['Dashboard', LayoutDashboard],
    ['Customers', Users],
    ['Job Cards', Wrench],
    ['More', Plus],
  ]
  return (
    <div className="grid grid-cols-4 gap-1">
      {items.map(([label, Icon]) => (
        <div
          key={label}
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-semibold',
            label === active ? 'bg-primary-50 text-primary-700' : 'text-slate-500',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </div>
      ))}
    </div>
  )
}

function OtpBoxes({ delay }: { delay: number }) {
  const digits = '482916'.split('')
  return (
    <div className="flex justify-between gap-1.5">
      {digits.map((d, i) => (
        <OtpBox key={i} digit={d} at={delay + i * 260} />
      ))}
    </div>
  )
}

function OtpBox({ digit, at }: { digit: string; at: number }) {
  const shown = useAfter(at)
  return (
    <div
      className={cn(
        'flex h-11 w-9 items-center justify-center rounded-lg border-2 bg-white text-lg font-bold transition-colors',
        shown ? 'border-primary-500 text-slate-900' : 'border-slate-300',
      )}
    >
      {shown ? digit : ''}
    </div>
  )
}

/** A number that switches from `from` to `to` at `at` ms. */
function Flip({ from, to, at, className }: { from: ReactNode; to: ReactNode; at: number; className?: string }) {
  const done = useAfter(at)
  return <span className={cn('inline-block transition-all', done && 'g-in', className)}>{done ? to : from}</span>
}

function Success({ title, text, delay = 0 }: { title: string; text: string; delay?: number }) {
  return (
    <In delay={delay} className="flex flex-col items-center pt-6 text-center">
      <div className="animate-pulse-ring flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-8 w-8" strokeWidth={3} />
      </div>
      <p className="mt-4 text-base font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 px-2 text-xs leading-relaxed text-slate-500">{text}</p>
    </In>
  )
}

function Toast({ text, delay }: { text: string; delay: number }) {
  return (
    <In delay={delay} className="absolute inset-x-3 bottom-3 z-10">
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-medium text-white shadow-lg">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        {text}
      </div>
    </In>
  )
}

function Stat({ label, value, tone, delay }: { label: string; value: string; tone: string; delay: number }) {
  return (
    <In delay={delay}>
      <MockCard className="p-2.5">
        <p className="text-[10px] font-semibold text-slate-500">{label}</p>
        <p className={cn('mt-0.5 text-lg font-extrabold', tone)}>{value}</p>
      </MockCard>
    </In>
  )
}

function JobRow({
  no,
  name,
  plate,
  amount,
  status,
  delay,
  collectAt,
}: {
  no: string
  name: string
  plate: string
  amount: string
  status: ReactNode
  delay: number
  collectAt?: number
}) {
  return (
    <In delay={delay}>
      <MockCard className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-primary-600">{no}</p>
            <p className="truncate text-sm font-bold text-slate-900">{name}</p>
            <p className="text-[11px] text-slate-500">{plate}</p>
          </div>
          <p className="text-sm font-extrabold text-slate-900">{amount}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">{status}</div>
          {collectAt !== undefined && (
            <MockButton tone="success" tapAt={collectAt} className="w-24" icon={<Wallet className="h-3.5 w-3.5" />}>
              Collect
            </MockButton>
          )}
        </div>
      </MockCard>
    </In>
  )
}

/* ------------------------------------------------------------- chapters */

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'register',
    title: 'Create your garage account',
    icon: UserPlus,
    blurb: 'Sign up with your mobile number — free for 30 days.',
    steps: [
      {
        title: 'Open GaragePilot and tap “Start Free Trial”',
        say: 'Open the GaragePilot website on your phone or computer and tap the Start Free Trial button.',
        screen: () => (
          <MockScreen title="GaragePilot" dark>
            <In className="rounded-2xl bg-brand-navy p-4 text-center text-white">
              <img src="/brand/garagepilot-logo.png" alt="" className="mx-auto h-14 w-14 rounded-xl bg-white object-contain p-1" />
              <p className="mt-3 text-lg font-extrabold leading-tight">Run your garage from your phone</p>
              <p className="mt-1 text-xs text-blue-100/80">Customers, job cards, payments and reports in one place.</p>
            </In>
            <In delay={500}>
              <MockButton tone="accent" tapAt={1500} icon={<Sparkles className="h-4 w-4" />}>
                Start Free Trial
              </MockButton>
            </In>
            <In delay={700}>
              <MockButton tone="outline">Login</MockButton>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Type your mobile number and tap “Send OTP”',
        say: 'Type your mobile number. This number becomes your login. Then tap Send OTP.',
        screen: () => (
          <MockScreen title="Create your garage account" back>
            <MockSteps steps={['Mobile', 'Verify OTP', 'Garage Details']} current={0} />
            <MockField label="Mobile Number" value="9876543210" delay={500} right={<Phone className="h-4 w-4 text-slate-400" />} />
            <In delay={1600}>
              <MockButton tapAt={2200}>Send OTP</MockButton>
            </In>
            <In delay={800}>
              <p className="text-center text-[11px] text-slate-500">30-day free trial • No payment required</p>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Enter the 6-digit code you received',
        say: 'You get a 6-digit code on your mobile. Type it in the boxes and tap Verify.',
        screen: () => (
          <MockScreen title="Verify your mobile" back>
            <MockSteps steps={['Mobile', 'Verify OTP', 'Garage Details']} current={1} />
            <In>
              <p className="text-center text-xs text-slate-500">
                Enter the 6-digit code we sent to <b className="text-slate-800">98765 43210</b>
              </p>
            </In>
            <OtpBoxes delay={600} />
            <In delay={2300}>
              <MockButton tapAt={2700}>Verify</MockButton>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Fill in your garage details',
        say: 'Write your name, your garage name, city, email and make a password. Then tap Create Account.',
        ms: 6500,
        screen: () => (
          <MockScreen title="Tell us about your garage" back>
            <MockSteps steps={['Mobile', 'Verify OTP', 'Garage Details']} current={2} />
            <MockField label="Owner Name" value="Rajesh Patel" delay={300} />
            <MockField label="Garage Name" value="ABC Auto Garage" delay={1300} />
            <MockField label="City" value="Ahmedabad" delay={2500} />
            <MockField label="Password" value="Garage@123" mask delay={3300} />
            <In delay={4300}>
              <MockButton tapAt={4800}>Create Account</MockButton>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Done — your free trial has started',
        say: 'That is all. Your account is ready, your 30-day free trial starts and you are taken to your dashboard.',
        screen: () => (
          <MockScreen title="Dashboard">
            <Success
              title="Welcome to GaragePilot!"
              text="Your 30-day free trial has started. Your garage name will show on every bill and report."
            />
            <Toast text="Welcome, Rajesh! Your free trial has started." delay={1200} />
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'login',
    title: 'Log in every day',
    icon: KeyRound,
    blurb: 'Mobile number and password — no OTP needed to log in.',
    steps: [
      {
        title: 'Type mobile number and password, tap “Sign In”',
        say: 'Tap Login. Type your registered mobile number and your password, then tap Sign In. No OTP is needed to log in.',
        ms: 6000,
        screen: () => (
          <MockScreen title="Sign in to your garage" dark>
            <MockField label="Mobile Number" value="9876543210" delay={400} />
            <MockField label="Password" value="Garage@123" mask delay={1600} right={<Lock className="h-4 w-4 text-slate-400" />} />
            <In delay={600}>
              <p className="text-right text-[11px] font-semibold text-primary-600">Forgot Password?</p>
            </In>
            <In delay={2600}>
              <MockButton tapAt={3200}>Sign In</MockButton>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Forgot your password? Reset it yourself',
        say: 'If you forget your password, tap Forgot Password on the login page, use your mobile number and set a new password.',
        screen: () => (
          <MockScreen title="Sign in to your garage" dark>
            <MockField label="Mobile Number" placeholder="9876543210" />
            <MockField label="Password" placeholder="Enter your password" />
            <div className="relative ml-auto w-fit">
              <p className="g-press text-[11px] font-semibold text-primary-600" style={{ ['--g-delay' as string]: '900ms' }}>
                Forgot Password?
              </p>
              <Tap delay={900} className="-bottom-6 right-0" />
            </div>
            <In delay={1900}>
              <MockCard className="border-primary-200 bg-primary-50 text-xs leading-relaxed text-primary-800">
                Enter your mobile number, verify the code and choose a new password. You can log in again straight away.
              </MockCard>
            </In>
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Your dashboard and menu',
    icon: LayoutDashboard,
    blurb: 'See today’s work and money at one glance.',
    steps: [
      {
        title: 'The dashboard shows your garage at a glance',
        say: 'The dashboard is your home page. It shows how many vehicles are in the garage, open job cards, money still to collect and your revenue.',
        screen: () => (
          <MockScreen title="Dashboard" footer={<BottomMenu active="Dashboard" />}>
            <In>
              <p className="text-xs text-slate-500">Good morning,</p>
              <p className="text-base font-extrabold text-slate-900">ABC Auto Garage</p>
            </In>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="In Service" value="6" tone="text-sky-700" delay={300} />
              <Stat label="Pending" value="3" tone="text-amber-600" delay={500} />
              <Stat label="To collect" value="₹8,400" tone="text-red-600" delay={700} />
              <Stat label="This month" value="₹1,26,500" tone="text-emerald-700" delay={900} />
            </div>
            <In delay={1300}>
              <MockCard>
                <p className="text-xs font-bold text-slate-900">Latest job cards</p>
                <div className="mt-2 space-y-1.5">
                  {['GJ01AB1234 · Amit Shah', 'GJ27CD5678 · Neha Joshi'].map((r) => (
                    <div key={r} className="flex items-center justify-between text-[11px] text-slate-600">
                      {r}
                      <MockBadge label="Pending" tone="amber" />
                    </div>
                  ))}
                </div>
              </MockCard>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Use the menu to move around',
        say: 'On a phone, the menu is at the bottom: Dashboard, Customers, Job Cards and More. On a computer, the same menu is on the left side.',
        screen: () => (
          <MockScreen title="More" footer={<BottomMenu active="More" />}>
            {(
              [
                ['Vehicles', Car],
                ['Staff & Salary', UsersRound],
                ['Car Selling', CarFront],
                ['Reports', BarChart3],
                ['Subscription', CreditCard],
              ] as [string, LucideIcon][]
            ).map(([label, Icon], i) => (
              <In key={label} delay={250 + i * 220}>
                <MockCard className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                </MockCard>
              </In>
            ))}
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'customer',
    title: 'Add a customer',
    icon: Users,
    blurb: 'Name and mobile number — that is all you need.',
    steps: [
      {
        title: 'Go to Customers and tap “Add Customer”',
        say: 'When a customer comes to your garage, open Customers and tap Add Customer.',
        screen: () => (
          <MockScreen title="Customers" footer={<BottomMenu active="Customers" />}>
            <In>
              <MockButton tone="primary" tapAt={1300} icon={<UserPlus className="h-4 w-4" />}>
                Add Customer
              </MockButton>
            </In>
            {['Amit Shah · 98250 11223', 'Neha Joshi · 99090 44556', 'Vikram Rao · 97230 77889'].map((c, i) => (
              <In key={c} delay={300 + i * 150}>
                <MockCard className="py-2.5 text-xs font-medium text-slate-700">{c}</MockCard>
              </In>
            ))}
          </MockScreen>
        ),
      },
      {
        title: 'Type the name and mobile number',
        say: 'Type the customer name and mobile number. WhatsApp is set to the same number already, so you do not need to type it again.',
        ms: 6000,
        screen: () => (
          <MockScreen title="Add New Customer" back>
            <MockSteps steps={STEPS_FLOW} current={0} />
            <MockField label="Customer Name *" value="Amit Shah" delay={400} />
            <MockField label="Mobile Number *" value="9825011223" delay={1400} />
            <In delay={2600}>
              <MockCard className="flex items-center gap-2 border-emerald-200 bg-emerald-50 py-2">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-xs font-semibold text-emerald-800">WhatsApp is the same as mobile</span>
              </MockCard>
            </In>
            <In delay={3000}>
              <p className="text-[11px] text-slate-500">Email, city and address are optional — add them only if you want.</p>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Tap “Next: Add Vehicle”',
        say: 'Tap Next, Add Vehicle. If the customer has no vehicle with them today, tap Save, add vehicle later.',
        screen: () => (
          <MockScreen
            title="Add New Customer"
            back
            footer={
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <MockButton tone="outline">Save only</MockButton>
                <MockButton tapAt={900} icon={<ArrowRight className="h-4 w-4" />}>
                  Next: Add Vehicle
                </MockButton>
              </div>
            }
          >
            <MockSteps steps={STEPS_FLOW} current={0} />
            <MockField label="Customer Name *" value="Amit Shah" />
            <MockField label="Mobile Number *" value="9825011223" />
            <Toast text="Amit Shah saved — now add the vehicle" delay={1700} />
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'vehicle',
    title: 'Add the vehicle',
    icon: Car,
    blurb: 'Number plate, type and the work needed.',
    steps: [
      {
        title: 'Type the number plate and pick the type',
        say: 'Type the vehicle number plate and the current kilometre reading. Then tap the vehicle type.',
        ms: 6000,
        screen: () => (
          <MockScreen title="Add vehicle for Amit Shah" back>
            <MockSteps steps={STEPS_FLOW} current={1} />
            <MockField label="Vehicle Number *" value="GJ01AB1234" delay={400} />
            <MockField label="Current KM Reading" value="45200" delay={1700} />
            <In delay={2600}>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-600">Vehicle Type *</p>
              <div className="flex flex-wrap gap-1.5">
                <MockChip label="Car" pickAt={3300} />
                <MockChip label="Bike" />
                <MockChip label="Scooter" />
              </div>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Tap the work needed',
        say: 'Tap the work the customer wants, like general service or oil change. You can pick more than one, or type your own.',
        screen: () => (
          <MockScreen title="Add vehicle for Amit Shah" back>
            <MockSteps steps={STEPS_FLOW} current={1} />
            <In>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-600">Work needed</p>
              <div className="flex flex-wrap gap-1.5">
                <MockChip label="General service" pickAt={700} tone="emerald" />
                <MockChip label="Oil change" pickAt={1800} tone="emerald" />
                <MockChip label="Brake check" />
                <MockChip label="Washing" />
                <MockChip label="AC service" />
              </div>
            </In>
            <In delay={2600}>
              <MockField label="Work / complaint *" value="General service, Oil change" />
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Tap “Save Vehicle” — all done',
        say: 'Tap Save Vehicle. The customer and vehicle are saved. Now you can create the job card with one tap.',
        ms: 5500,
        screen: () => (
          <MockScreen title="Amit Shah">
            <MockSteps steps={STEPS_FLOW} current={2} />
            <Success title="Customer and vehicle saved" text="GJ01AB1234 is now on Amit Shah’s file." />
            <In delay={1400}>
              <MockButton tone="success" tapAt={2600} icon={<ClipboardList className="h-4 w-4" />}>
                Create Job Card
              </MockButton>
            </In>
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'jobcard',
    title: 'Create a job card',
    icon: ClipboardList,
    blurb: 'Write the work and price — the total adds itself.',
    steps: [
      {
        title: 'Customer and vehicle are already filled in',
        say: 'The job card opens with the customer and vehicle already filled in. Check the complaint and pick the staff member doing the work.',
        screen: () => (
          <MockScreen title="New Job Card" back>
            <In>
              <MockCard className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Customer & Vehicle</p>
                <p className="text-sm font-bold text-slate-900">Amit Shah · 98250 11223</p>
                <p className="text-xs text-slate-600">GJ01AB1234 · 45,200 km</p>
              </MockCard>
            </In>
            <In delay={500}>
              <MockField label="Customer Complaint *" value="General service, Oil change" />
            </In>
            <In delay={900}>
              <MockField label="Assigned Staff" value="Suresh (Mechanic)" delay={1300} />
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Add each job with its price',
        say: 'Add each job or spare part with its price. The total is added up for you automatically.',
        ms: 6500,
        screen: () => (
          <MockScreen title="New Job Card" back>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Services / Job Items</p>
            {[
              ['General service', '₹1,500', 300],
              ['Engine oil 3L', '₹1,200', 1500],
              ['Oil filter', '₹350', 2700],
            ].map(([name, price, at]) => (
              <In key={name as string} delay={at as number}>
                <MockCard className="flex items-center justify-between py-2 text-xs">
                  <span className="font-semibold text-slate-800">{name}</span>
                  <span className="font-bold text-slate-900">{price}</span>
                </MockCard>
              </In>
            ))}
            <In delay={300}>
              <MockCard className="flex items-center justify-between border-primary-200 bg-primary-50">
                <span className="text-xs font-bold text-primary-800">Total</span>
                <span className="text-lg font-extrabold text-primary-900">
                  <Flip from="₹1,500" to={<Flip from="₹2,700" to="₹3,050" at={1200} />} at={1700} />
                </span>
              </MockCard>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Save — the vehicle is now “In Service”',
        say: 'Tap Save Job Card. The vehicle status changes from Pending to In Service, so you always know which vehicles are being worked on.',
        screen: () => (
          <MockScreen
            title="New Job Card"
            back
            footer={
              <MockButton tapAt={700} icon={<Check className="h-4 w-4" />}>
                Save Job Card
              </MockButton>
            }
          >
            <In delay={1300}>
              <MockCard className="space-y-2 text-center">
                <p className="text-xs font-semibold text-slate-500">GJ01AB1234</p>
                <p className="text-sm">
                  <Flip
                    at={1900}
                    from={<MockBadge label="Pending" tone="amber" />}
                    to={<MockBadge label="In Service" tone="sky" />}
                  />
                </p>
              </MockCard>
            </In>
            <Toast text="Job card JC-0142 created" delay={2300} />
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'payment',
    title: 'Collect payment',
    icon: Wallet,
    blurb: 'Full or part payment, with a WhatsApp receipt.',
    steps: [
      {
        title: 'On Job Cards, tap the green “Collect” button',
        say: 'When the customer pays, open Job Cards and tap the green Collect button on their job card.',
        screen: () => (
          <MockScreen title="Job Cards" footer={<BottomMenu active="Job Cards" />}>
            <JobRow
              no="JC-0142"
              name="Amit Shah"
              plate="GJ01AB1234"
              amount="₹3,050"
              status={
                <>
                  <MockBadge label="Pending" tone="amber" />
                  <MockBadge label="Unpaid" tone="red" />
                </>
              }
              delay={0}
              collectAt={1300}
            />
            <JobRow
              no="JC-0141"
              name="Neha Joshi"
              plate="GJ27CD5678"
              amount="₹1,800"
              status={
                <>
                  <MockBadge label="Delivered" tone="emerald" />
                  <MockBadge label="Paid" tone="emerald" />
                </>
              }
              delay={250}
            />
          </MockScreen>
        ),
      },
      {
        title: 'Pick Full or Half, choose Cash / UPI, tap “Receive”',
        say: 'A small window opens. Tap Full or Half for the amount, pick how they paid, like Cash or UPI, keep the WhatsApp receipt ticked and tap Receive.',
        ms: 7000,
        screen: () => (
          <div className="relative h-full bg-slate-900/50 pt-16">
            <In className="h-full rounded-t-2xl bg-white p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">Collect payment · JC-0142</p>
                  <span className="text-xs text-slate-400">✕</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    ['Total', '₹3,050', 'text-slate-900'],
                    ['Paid', '₹0', 'text-emerald-700'],
                    ['Due', '₹3,050', 'text-red-600'],
                  ].map(([l, v, t]) => (
                    <div key={l} className="rounded-lg bg-slate-50 py-1.5">
                      <p className="text-[10px] text-slate-500">{l}</p>
                      <p className={cn('text-sm font-extrabold', t)}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <MockChip label="Full ₹3,050" pickAt={800} />
                  <MockChip label="Half ₹1,525" />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-slate-600">Paid by</p>
                  <div className="flex flex-wrap gap-1.5">
                    <MockChip label="Cash" tone="emerald" />
                    <MockChip label="UPI" pickAt={2200} tone="violet" />
                    <MockChip label="Card" tone="sky" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> Send receipt on WhatsApp
                </div>
                <MockButton tone="success" tapAt={3600} icon={<Banknote className="h-4 w-4" />}>
                  Receive ₹3,050
                </MockButton>
              </div>
            </In>
          </div>
        ),
      },
      {
        title: 'See every payment in the same window',
        say: 'The payment history is right there in the same window. If the customer paid only half, the job card shows Partial until the rest is paid.',
        ms: 6000,
        screen: () => (
          <div className="relative h-full bg-slate-900/50 pt-16">
            <div className="h-full space-y-3 rounded-t-2xl bg-white p-4">
              <p className="text-sm font-extrabold text-slate-900">Payment history</p>
              {[
                ['₹1,525 · Cash', '12 Nov, 10:30 am', 200],
                ['₹1,525 · UPI', '14 Nov, 6:15 pm', 1100],
              ].map(([a, d, at]) => (
                <In key={a as string} delay={at as number}>
                  <MockCard className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{a}</p>
                      <p className="text-[10px] text-slate-500">{d}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </MockCard>
                </In>
              ))}
              <In delay={300}>
                <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-xs font-semibold text-slate-600">
                  Status
                  <Flip
                    at={1900}
                    from={<MockBadge label="Partial" tone="amber" />}
                    to={<MockBadge label="Paid" tone="emerald" />}
                  />
                </div>
              </In>
              <In delay={2500}>
                <MockCard className="flex items-center gap-2 border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  Receipt sent to Amit on WhatsApp
                </MockCard>
              </In>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'status',
    title: 'What the colours mean',
    icon: Info,
    blurb: 'Yellow, blue, green — know every status in a second.',
    steps: [
      {
        title: 'Vehicle status',
        say: 'Yellow Pending means no job card yet. Blue In Service means a job card is created and work is going on. Green Completed means the vehicle is delivered and payment is done.',
        ms: 8000,
        screen: () => (
          <MockScreen title="Vehicles">
            {(
              [
                ['Pending', 'amber', 'Vehicle came in — job card not created yet.'],
                ['In Service', 'sky', 'Job card created — work is going on.'],
                ['Completed', 'emerald', 'Vehicle delivered and payment done.'],
              ] as [string, 'amber' | 'sky' | 'emerald', string][]
            ).map(([label, tone, text], i) => (
              <In key={label} delay={300 + i * 1500}>
                <MockCard className="space-y-1.5">
                  <MockBadge label={label} tone={tone} />
                  <p className="text-xs leading-relaxed text-slate-600">{text}</p>
                </MockCard>
              </In>
            ))}
          </MockScreen>
        ),
      },
      {
        title: 'Job card and payment status',
        say: 'Unpaid means no payment is recorded. Partial means part of the money is paid. Delivered and Paid means full payment is done and the vehicle has gone home.',
        ms: 8000,
        screen: () => (
          <MockScreen title="Job Cards">
            {(
              [
                [['Pending', 'amber'], ['Unpaid', 'red'], 'Not a single payment recorded yet.'],
                [['Pending', 'amber'], ['Partial', 'amber'], 'Part of the bill is paid — some money is still due.'],
                [['Delivered', 'emerald'], ['Paid', 'emerald'], 'Full payment done and vehicle delivered.'],
              ] as [[string, MockToneKey], [string, MockToneKey], string][]
            ).map(([a, b, text], i) => (
              <In key={text} delay={300 + i * 1500}>
                <MockCard className="space-y-1.5">
                  <div className="flex gap-1">
                    <MockBadge label={a[0]} tone={a[1]} />
                    <MockBadge label={b[0]} tone={b[1]} />
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{text}</p>
                </MockCard>
              </In>
            ))}
          </MockScreen>
        ),
      },
      {
        title: 'Not sure? Tap the ⓘ on any status',
        say: 'Anywhere in the app, tap a status badge with the small i mark to see what it means in simple words.',
        screen: () => (
          <MockScreen title="Vehicles">
            <MockCard className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">GJ01AB1234</p>
                <p className="text-[11px] text-slate-500">Amit Shah</p>
              </div>
              <span className="relative inline-flex items-center gap-1">
                <MockBadge label="In Service" tone="sky" />
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <Tap delay={700} className="-bottom-6 -right-1" />
              </span>
            </MockCard>
            <In delay={1400}>
              <div className="rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-white shadow-xl">
                <p className="font-bold">In Service</p>
                <p className="mt-1 text-slate-300">A job card is created and the vehicle is being worked on in your garage.</p>
              </div>
            </In>
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports, Excel and PDF',
    icon: BarChart3,
    blurb: 'Your earnings by day or month, ready to print.',
    steps: [
      {
        title: 'Open Reports to see your earnings',
        say: 'Open Reports, then Total Revenue or Revenue This Month. Pick the dates and see how much your garage earned.',
        screen: () => (
          <MockScreen title="Revenue This Month">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Revenue" value="₹1,26,500" tone="text-emerald-700" delay={200} />
              <Stat label="Job cards" value="48" tone="text-primary-700" delay={400} />
            </div>
            <In delay={700}>
              <MockCard>
                <div className="flex h-24 items-end gap-1.5">
                  {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="g-in flex-1 rounded-t bg-gradient-to-t from-primary-600 to-primary-400"
                      style={{ height: `${h}%`, ['--g-delay' as string]: `${900 + i * 120}ms` }}
                    />
                  ))}
                </div>
              </MockCard>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Download as Excel or PDF',
        say: 'Tap Excel or PDF to download. The PDF has your garage name and the GaragePilot logo, ready to print or share.',
        ms: 6000,
        screen: () => (
          <MockScreen title="Revenue This Month">
            <div className="grid grid-cols-2 gap-2">
              <MockButton tone="outline" icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}>
                Excel
              </MockButton>
              <MockButton tone="outline" tapAt={700} icon={<FileDown className="h-4 w-4 text-red-600" />}>
                PDF
              </MockButton>
            </div>
            <In delay={1500}>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <div className="flex items-center gap-2 border-b-2 border-primary-600 pb-2">
                  <img src="/brand/garagepilot-logo.png" alt="" className="h-7 w-7 object-contain" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">ABC Auto Garage</p>
                    <p className="text-[9px] text-slate-500">Revenue This Month</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn('h-2.5 rounded', i % 2 ? 'bg-slate-100' : 'bg-slate-200')} />
                  ))}
                </div>
              </div>
            </In>
            <Toast text="Report downloaded" delay={2600} />
          </MockScreen>
        ),
      },
    ],
  },
  {
    id: 'more',
    title: 'Staff, salary and car sales',
    icon: UsersRound,
    blurb: 'Everything else your garage does, in the same app.',
    steps: [
      {
        title: 'Keep your staff and their salary',
        say: 'Under Staff, add your mechanics and helpers. In Manage Salary, note every salary you pay, so nothing is forgotten.',
        screen: () => (
          <MockScreen title="Manage Staff">
            {['Suresh · Mechanic', 'Ramesh · Helper', 'Kiran · Painter'].map((s, i) => (
              <In key={s} delay={200 + i * 250}>
                <MockCard className="flex items-center justify-between py-2.5 text-xs font-semibold text-slate-800">
                  {s}
                  <MockBadge label="Active" tone="emerald" />
                </MockCard>
              </In>
            ))}
            <In delay={1200}>
              <MockButton tone="soft" tapAt={1900} icon={<Wallet className="h-4 w-4" />}>
                Manage Salary
              </MockButton>
            </In>
          </MockScreen>
        ),
      },
      {
        title: 'Sell used cars too',
        say: 'If you also sell used cars, add them under Car Add For Selling. When one is sold, record it in Car Sold Detail and print the sale receipt.',
        screen: () => (
          <MockScreen title="Car Add For Selling">
            {[
              ['Maruti Swift 2019', '₹4,85,000', 'For sale', 'sky'],
              ['Honda City 2017', '₹6,20,000', 'Sold', 'emerald'],
            ].map(([n, p, s, t], i) => (
              <In key={n} delay={200 + i * 300}>
                <MockCard className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{n}</p>
                    <p className="text-[11px] text-slate-500">{p}</p>
                  </div>
                  <MockBadge label={s} tone={t as MockToneKey} />
                </MockCard>
              </In>
            ))}
          </MockScreen>
        ),
      },
      {
        title: 'Check your plan any time',
        say: 'Open Subscription to see how many days are left in your plan and renew it when needed. Your data stays safe.',
        screen: () => (
          <MockScreen title="Subscription">
            <In>
              <MockCard className="space-y-2 text-center">
                <Smartphone className="mx-auto h-8 w-8 text-primary-600" />
                <p className="text-sm font-extrabold text-slate-900">Free Trial</p>
                <p className="text-2xl font-extrabold text-primary-700">
                  <Typed text="24 days left" delay={500} />
                </p>
              </MockCard>
            </In>
            <In delay={1500}>
              <MockButton tone="accent">Renew plan</MockButton>
            </In>
          </MockScreen>
        ),
      },
    ],
  },
]

type MockToneKey = 'amber' | 'sky' | 'emerald' | 'red' | 'slate' | 'violet'

export const GUIDE_STEP_MS = 5000
