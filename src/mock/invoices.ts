import type { Invoice } from '@/types'

export const invoices: Invoice[] = [
  { id: '1', code: 'INV-1024', customerName: 'Rajesh Patel', amount: 4500, status: 'paid', date: '12 Aug 2026' },
  { id: '2', code: 'INV-1025', customerName: 'Amit Shah', amount: 2700, status: 'pending', date: '13 Aug 2026' },
  { id: '3', code: 'INV-1026', customerName: 'Priya Mehta', amount: 800, status: 'paid', date: '11 Aug 2026' },
  { id: '4', code: 'INV-1027', customerName: 'Suresh Desai', amount: 19600, status: 'paid', date: '08 Aug 2026' },
  { id: '5', code: 'INV-1028', customerName: 'Kiran Joshi', amount: 9500, status: 'pending', date: '13 Aug 2026' },
  { id: '6', code: 'INV-1029', customerName: 'Neha Trivedi', amount: 3200, status: 'overdue', date: '05 Aug 2026' },
]
