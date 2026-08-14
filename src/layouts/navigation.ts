import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  FileText,
  UsersRound,
  Wallet,
  BarChart3,
  Settings,
  CreditCard,
  Building2,
  Package,
  IndianRupee,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Show in the mobile bottom bar (max 4 incl. More) */
  primary?: boolean
}

export const ownerNav: NavItem[] = [
  { label: 'Dashboard', to: '/app', icon: LayoutDashboard, primary: true },
  { label: 'Customers', to: '/app/customers', icon: Users, primary: true },
  { label: 'Vehicles', to: '/app/vehicles', icon: Car },
  { label: 'Job Cards', to: '/app/job-cards', icon: Wrench, primary: true },
  { label: 'Billing', to: '/app/billing', icon: FileText },
  { label: 'Staff', to: '/app/staff', icon: UsersRound },
  { label: 'Salary', to: '/app/salary', icon: Wallet },
  { label: 'Reports', to: '/app/reports', icon: BarChart3 },
  { label: 'Subscription', to: '/app/subscription', icon: CreditCard },
  { label: 'Settings', to: '/app/settings', icon: Settings },
]

export const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, primary: true },
  { label: 'Garages', to: '/admin/garages', icon: Building2, primary: true },
  { label: 'Plans', to: '/admin/plans', icon: Package, primary: true },
  { label: 'Payments', to: '/admin/payments', icon: IndianRupee },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
]
