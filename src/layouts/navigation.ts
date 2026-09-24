import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  FileText,
  UsersRound,
  Wallet,
  BarChart3,
  CreditCard,
  Building2,
  Package,
  IndianRupee,
  CarFront,
  BadgeIndianRupee,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Show in the mobile bottom bar (max 4 incl. More) */
  primary?: boolean
  /**
   * Pages filed under this one. A group opens on click — and on its own when
   * one of its pages is the current one — instead of navigating anywhere
   * itself, so `to` is only the path its children live under.
   */
  children?: NavItem[]
}

/** The group and the pages under it, flattened — for a plain list of links. */
export function flattenNav(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => (item.children ? [item, ...item.children] : [item]))
}

/** The item a path is currently on, looked for inside groups as well. */
export function findNavItem(items: NavItem[], path: string): NavItem | undefined {
  return flattenNav(items).find((item) => item.to === path)
}

export const ownerNav: NavItem[] = [
  { label: 'Dashboard', to: '/app', icon: LayoutDashboard, primary: true },
  { label: 'Customers', to: '/app/customers', icon: Users, primary: true },
  { label: 'Vehicles', to: '/app/vehicles', icon: Car },
  { label: 'Job Cards', to: '/app/job-cards', icon: Wrench, primary: true },
  { label: 'Billing', to: '/app/billing', icon: FileText },
  { label: 'Staff', to: '/app/staff', icon: UsersRound },
  {
    label: 'Car Selling',
    to: '/app/car-selling',
    icon: CarFront,
    children: [
      { label: 'Car Add For Selling', to: '/app/car-selling', icon: CarFront },
      { label: 'Car Sold Detail', to: '/app/car-sold', icon: BadgeIndianRupee },
    ],
  },
  { label: 'Salary', to: '/app/salary', icon: Wallet },
  { label: 'Reports', to: '/app/reports', icon: BarChart3 },
  { label: 'Subscription', to: '/app/subscription', icon: CreditCard },
]

export const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, primary: true },
  { label: 'Garages', to: '/admin/garages', icon: Building2, primary: true },
  { label: 'Plans', to: '/admin/plans', icon: Package, primary: true },
  { label: 'Payments', to: '/admin/payments', icon: IndianRupee },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
]
