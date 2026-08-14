export type SubscriptionStatus = 'trial' | 'active' | 'expiring' | 'expired'
export type JobStatus = 'pending' | 'in-progress' | 'completed' | 'delivered'
export type InvoiceStatus = 'paid' | 'pending' | 'overdue'
export type PaymentStatus = 'successful' | 'pending' | 'failed'
export type StaffStatus = 'active' | 'inactive'
export type SalaryStatus = 'paid' | 'pending'
export type GarageStatus = 'active' | 'trial' | 'expired'

export interface Customer {
  id: string
  name: string
  mobile: string
  email?: string
  address?: string
  vehicleCount: number
  lastVisit: string
}

export interface Vehicle {
  id: string
  number: string
  name: string
  type: string
  brand: string
  model: string
  year: string
  fuelType: string
  ownerName: string
  ownerId: string
  lastService: string
}

export interface JobPart {
  name: string
  qty: number
  price: number
}

export interface JobCard {
  id: string
  code: string
  vehicleName: string
  vehicleNumber: string
  customerName: string
  customerMobile: string
  services: string[]
  parts: JobPart[]
  labour: number
  total: number
  status: JobStatus
  date: string
}

export interface Invoice {
  id: string
  code: string
  customerName: string
  amount: number
  status: InvoiceStatus
  date: string
}

export interface StaffMember {
  id: string
  name: string
  role: string
  category: 'Mechanic' | 'Service Advisor' | 'Other'
  mobile: string
  status: StaffStatus
  salary: number
  salaryStatus: SalaryStatus
}

export interface Payment {
  id: string
  garage: string
  plan: string
  amount: number
  date: string
  status: PaymentStatus
}

export interface Plan {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  active: boolean
  highlight?: boolean
  current?: boolean
}

export interface Garage {
  id: string
  name: string
  owner: string
  mobile: string
  status: GarageStatus
  daysRemaining?: number
  plan: string
  joined: string
}

export interface Stat {
  label: string
  value: string
}
