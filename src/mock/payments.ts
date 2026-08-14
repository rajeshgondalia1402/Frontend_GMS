import type { Payment } from '@/types'

export const payments: Payment[] = [
  { id: 'PAY-90231', garage: 'ABC Auto Garage', plan: 'Yearly', amount: 1499, date: '12 Aug 2026', status: 'successful' },
  { id: 'PAY-90232', garage: 'Speed Motors', plan: 'Monthly', amount: 149, date: '12 Aug 2026', status: 'successful' },
  { id: 'PAY-90233', garage: 'City Car Care', plan: 'Monthly', amount: 149, date: '11 Aug 2026', status: 'pending' },
  { id: 'PAY-90234', garage: 'Elite Garage', plan: 'Yearly', amount: 1499, date: '10 Aug 2026', status: 'failed' },
  { id: 'PAY-90235', garage: 'Prime Auto Works', plan: 'Monthly', amount: 149, date: '09 Aug 2026', status: 'successful' },
]
