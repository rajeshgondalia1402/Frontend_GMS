import type { Plan } from '@/types'

export const plans: Plan[] = [
  {
    id: '1', name: 'Free Trial', price: 0, duration: '30 Days',
    features: ['Full access', 'All features', 'Customer management', 'Job cards'],
    active: true, current: true,
  },
  {
    id: '2', name: 'Monthly', price: 149, duration: 'per month',
    features: ['All garage features', 'Customer management', 'Job cards', 'Reports', 'Staff management'],
    active: true,
  },
  {
    id: '3', name: 'Yearly', price: 1499, duration: 'per year',
    features: ['All features', 'Customer management', 'Job cards', 'Reports', 'Priority support'],
    active: true, highlight: true,
  },
]
