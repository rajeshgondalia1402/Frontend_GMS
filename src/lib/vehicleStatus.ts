import type { Tone } from '@/components/ui/Badge'
import type { VehicleStatus } from '@/types/vehicle'

/** In the order they appear in the status dropdown. */
export const VEHICLE_STATUSES: VehicleStatus[] = ['PENDING', 'IN_SERVICE', 'COMPLETED']

const LABELS: Record<VehicleStatus, string> = {
  PENDING: 'Pending',
  IN_SERVICE: 'In Service',
  COMPLETED: 'Completed',
}

const TONES: Record<VehicleStatus, Tone> = {
  PENDING: 'warning',
  IN_SERVICE: 'info',
  COMPLETED: 'success',
}

/** Falls back to the raw value, so a status added by the API still reads. */
export function vehicleStatusLabel(status: VehicleStatus): string {
  return LABELS[status] ?? status
}

export function vehicleStatusTone(status: VehicleStatus): Tone {
  return TONES[status] ?? 'neutral'
}

export const VEHICLE_STATUS_OPTIONS = VEHICLE_STATUSES.map((status) => ({
  label: vehicleStatusLabel(status),
  value: status,
}))
