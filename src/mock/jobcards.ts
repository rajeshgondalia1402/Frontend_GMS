import type { JobCard } from '@/types'

export const jobCards: JobCard[] = [
  {
    id: '1', code: 'JOB-1024', vehicleName: 'Honda City', vehicleNumber: 'GJ 05 XX 1234',
    customerName: 'Rajesh Patel', customerMobile: '9876543210',
    services: ['Oil Change', 'Brake Inspection', 'General Service'],
    parts: [ { name: 'Engine Oil', qty: 1, price: 2000 }, { name: 'Oil Filter', qty: 1, price: 500 } ],
    labour: 2000, total: 4500, status: 'in-progress', date: '12 Aug 2026',
  },
  {
    id: '2', code: 'JOB-1025', vehicleName: 'Hyundai Creta', vehicleNumber: 'GJ 01 CD 5678',
    customerName: 'Amit Shah', customerMobile: '9825012345',
    services: ['AC Service', 'Wheel Alignment'],
    parts: [ { name: 'AC Gas', qty: 1, price: 1200 } ],
    labour: 1500, total: 2700, status: 'pending', date: '13 Aug 2026',
  },
  {
    id: '3', code: 'JOB-1026', vehicleName: 'Tata Nexon', vehicleNumber: 'GJ 18 EF 9012',
    customerName: 'Priya Mehta', customerMobile: '9898765432',
    services: ['Battery Check', 'Software Update'],
    parts: [],
    labour: 800, total: 800, status: 'completed', date: '11 Aug 2026',
  },
  {
    id: '4', code: 'JOB-1027', vehicleName: 'Toyota Innova', vehicleNumber: 'GJ 27 GH 3456',
    customerName: 'Suresh Desai', customerMobile: '9723456789',
    services: ['Full Service', 'Tyre Replacement'],
    parts: [ { name: 'Tyre (Set of 4)', qty: 4, price: 16000 }, { name: 'Air Filter', qty: 1, price: 600 } ],
    labour: 3000, total: 19600, status: 'delivered', date: '08 Aug 2026',
  },
  {
    id: '5', code: 'JOB-1028', vehicleName: 'Kia Seltos', vehicleNumber: 'GJ 05 JK 7890',
    customerName: 'Kiran Joshi', customerMobile: '9712345678',
    services: ['Denting & Painting'],
    parts: [ { name: 'Paint', qty: 1, price: 4500 } ],
    labour: 5000, total: 9500, status: 'in-progress', date: '13 Aug 2026',
  },
  {
    id: '6', code: 'JOB-1029', vehicleName: 'Swift Dzire', vehicleNumber: 'GJ 05 AB 1234',
    customerName: 'Rajesh Patel', customerMobile: '9876543210',
    services: ['Oil Change'],
    parts: [ { name: 'Engine Oil', qty: 1, price: 1800 } ],
    labour: 500, total: 2300, status: 'pending', date: '14 Aug 2026',
  },
]
