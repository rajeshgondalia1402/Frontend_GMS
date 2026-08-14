import type { Vehicle } from '@/types'

export const vehicles: Vehicle[] = [
  { id: '1', number: 'GJ 05 AB 1234', name: 'Swift Dzire', type: 'Sedan', brand: 'Maruti Suzuki', model: 'Dzire', year: '2021', fuelType: 'Petrol', ownerName: 'Rajesh Patel', ownerId: '1', lastService: '10 Aug 2026' },
  { id: '2', number: 'GJ 05 XX 1234', name: 'Honda City', type: 'Sedan', brand: 'Honda', model: 'City', year: '2020', fuelType: 'Petrol', ownerName: 'Rajesh Patel', ownerId: '1', lastService: '12 Aug 2026' },
  { id: '3', number: 'GJ 01 CD 5678', name: 'Hyundai Creta', type: 'SUV', brand: 'Hyundai', model: 'Creta', year: '2022', fuelType: 'Diesel', ownerName: 'Amit Shah', ownerId: '2', lastService: '09 Aug 2026' },
  { id: '4', number: 'GJ 18 EF 9012', name: 'Tata Nexon', type: 'SUV', brand: 'Tata', model: 'Nexon', year: '2023', fuelType: 'Electric', ownerName: 'Priya Mehta', ownerId: '3', lastService: '06 Aug 2026' },
  { id: '5', number: 'GJ 27 GH 3456', name: 'Toyota Innova', type: 'MUV', brand: 'Toyota', model: 'Innova Crysta', year: '2019', fuelType: 'Diesel', ownerName: 'Suresh Desai', ownerId: '4', lastService: '04 Aug 2026' },
  { id: '6', number: 'GJ 05 JK 7890', name: 'Kia Seltos', type: 'SUV', brand: 'Kia', model: 'Seltos', year: '2022', fuelType: 'Petrol', ownerName: 'Kiran Joshi', ownerId: '5', lastService: '01 Aug 2026' },
]
