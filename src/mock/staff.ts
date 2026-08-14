import type { StaffMember } from '@/types'

export const staff: StaffMember[] = [
  { id: '1', name: 'Amit Sharma', role: 'Senior Mechanic', category: 'Mechanic', mobile: '9876543210', status: 'active', salary: 18000, salaryStatus: 'paid' },
  { id: '2', name: 'Rahul Patel', role: 'Mechanic', category: 'Mechanic', mobile: '9825011122', status: 'active', salary: 16000, salaryStatus: 'pending' },
  { id: '3', name: 'Sanjay Verma', role: 'Service Advisor', category: 'Service Advisor', mobile: '9898223344', status: 'active', salary: 20000, salaryStatus: 'paid' },
  { id: '4', name: 'Deepak Nair', role: 'Service Advisor', category: 'Service Advisor', mobile: '9723556677', status: 'inactive', salary: 19000, salaryStatus: 'pending' },
  { id: '5', name: 'Ravi Kumar', role: 'Helper', category: 'Other', mobile: '9712889900', status: 'active', salary: 12000, salaryStatus: 'paid' },
]
