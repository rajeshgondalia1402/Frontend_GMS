import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { CarFront, ChevronRight, Clock, Phone, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useDashboardPage } from '@/hooks/useDashboardPage'
import {
  getDashboardInServiceVehicles,
  getDashboardNewVehicles,
  getDashboardPendingVehicles,
} from '@/services/dashboardService'
import { monthLabel } from '@/lib/dashboard'
import { vehicleStatusLabel, vehicleStatusTone } from '@/lib/vehicleStatus'
import { cn } from '@/lib/utils'
import type { DashboardNewVehicle, DashboardVehiclesPage } from '@/types/dashboard'
import {
  AddedOn,
  Avatar,
  ListPanel,
  NEW_TAB,
  PANEL_PAGE_SIZE,
  openInNewTab,
  panelRowHover,
} from './ListPanel'
import type { ListPanelTone } from './ListPanel'

/** `Maruti Swift VXI`, or the vehicle type when no make was recorded. */
function makeAndModel(vehicle: DashboardNewVehicle): string {
  return (
    [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(' ') || vehicle.vehicleType
  )
}

/** `Petrol · White · 42,000 km` — whatever of the three was recorded. */
function specLine(vehicle: DashboardNewVehicle): string {
  return (
    [
      vehicle.fuelType,
      vehicle.color,
      vehicle.currentKm != null ? `${vehicle.currentKm.toLocaleString('en-IN')} km` : null,
    ]
      .filter(Boolean)
      .join(' · ') || '—'
  )
}

/** The registration drawn as a small number plate, so it reads as one at a glance. */
function Plate({ number }: { number: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-300 bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-slate-800 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]">
      {number}
    </span>
  )
}

function JobCards({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        count > 0 ? 'text-slate-600' : 'text-slate-400',
      )}
    >
      <Wrench className="h-3 w-3" />
      {count === 0 ? 'No job card yet' : `${count} job card${count === 1 ? '' : 's'}`}
    </span>
  )
}

/** Which vehicles the panel lists — one per tile that opens it. */
export type VehiclesPanelVariant = 'new' | 'pending' | 'inService'

interface VariantConfig {
  fetchPage: (page: number, limit: number) => Promise<DashboardVehiclesPage>
  tone: ListPanelTone
  icon: LucideIcon
  title: string
  subtitle: (data: DashboardVehiclesPage | null) => string
  /** What the date column means for this list. */
  dateHeader: string
  failure: string
  empty: ComponentProps<typeof ListPanel>['empty']
}

const VARIANTS: Record<VehiclesPanelVariant, VariantConfig> = {
  new: {
    fetchPage: getDashboardNewVehicles,
    tone: 'info',
    icon: CarFront,
    title: 'New Vehicles',
    subtitle: (data) => `Added in ${monthLabel(data?.month)} · from the 1st to today`,
    dateHeader: 'Added',
    failure: 'Could not load new vehicles.',
    empty: {
      title: 'No new vehicles this month yet',
      description: 'Vehicles you book in from the 1st of the month will show up here.',
      action: { to: '/app/vehicles/new', label: 'Add vehicle' },
    },
  },
  pending: {
    fetchPage: getDashboardPendingVehicles,
    tone: 'warning',
    icon: Clock,
    title: 'Pending Vehicles',
    subtitle: () => 'Waiting to be worked on · longest waiting first',
    dateHeader: 'Waiting since',
    failure: 'Could not load pending vehicles.',
    empty: {
      title: 'No vehicles waiting',
      description: 'Every vehicle booked in has been started on. Nice work.',
    },
  },
  inService: {
    fetchPage: getDashboardInServiceVehicles,
    tone: 'info',
    icon: Wrench,
    title: 'In Service',
    subtitle: () => 'On the ramp right now · longest in first',
    dateHeader: 'Booked in',
    failure: 'Could not load vehicles in service.',
    empty: {
      title: 'No vehicles in service',
      description: 'Nothing is on the ramp right now.',
    },
  },
}

/**
 * A page of vehicles with their owners, under the tile that opened it: the new
 * ones this month, the ones waiting, or the ones on the ramp. A row opens the
 * owner's screen, which is where a vehicle is looked after — the same place
 * the Vehicles list sends it.
 *
 * The parent keys it by variant, so switching tiles starts again on page 1.
 */
export function VehiclesPanel({ variant }: { variant: VehiclesPanelVariant }) {
  const config = VARIANTS[variant]
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PANEL_PAGE_SIZE)

  const { data, loading, error, reload } = useDashboardPage(
    config.fetchPage,
    page,
    limit,
    config.failure,
  )
  const vehicles = data?.vehicles ?? []

  const ownerPath = (vehicle: DashboardNewVehicle) => `/app/customers/${vehicle.customer.id}`

  return (
    <ListPanel
      tone={config.tone}
      icon={config.icon}
      title={config.title}
      subtitle={config.subtitle(data)}
      viewAll={{ to: '/app/vehicles', label: 'All vehicles' }}
      empty={config.empty}
      loading={loading}
      error={error}
      onRetry={reload}
      pagination={data?.pagination ?? null}
      count={vehicles.length}
      onPageChange={setPage}
      onLimitChange={(next) => {
        setLimit(next)
        setPage(1)
      }}
    >
      {/* Table, from tablet width up */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-2.5">Vehicle</th>
            <th className="px-3 py-2.5">Owner</th>
            <th className="hidden px-3 py-2.5 lg:table-cell">Details</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">{config.dateHeader}</th>
            <th className="w-10 px-3 py-2.5" aria-label="Open" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vehicles.map((vehicle) => (
            <tr
              key={vehicle.id}
              onClick={() => openInNewTab(ownerPath(vehicle))}
              className={cn('group cursor-pointer transition-colors', panelRowHover(config.tone))}
            >
              <td className="px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <CarFront className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <Plate number={vehicle.vehicleNumber} />
                    <p className="truncate text-xs text-slate-500">{makeAndModel(vehicle)}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={vehicle.customer.fullName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-sky-700">
                      {vehicle.customer.fullName}
                    </p>
                    <a
                      href={`tel:${vehicle.customer.mobileNumber}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700"
                    >
                      <Phone className="h-3 w-3" /> {vehicle.customer.mobileNumber}
                    </a>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                <p className="text-sm text-slate-600">{specLine(vehicle)}</p>
                <JobCards count={vehicle.jobCardCount} />
              </td>
              <td className="px-3 py-3">
                <Badge tone={vehicleStatusTone(vehicle.status)}>
                  {vehicleStatusLabel(vehicle.status)}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <AddedOn createdAt={vehicle.createdAt} />
              </td>
              <td className="px-3 py-3">
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stacked rows on a phone */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id}>
            <Link
              {...NEW_TAB}
              to={ownerPath(vehicle)}
              className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <CarFront className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <Plate number={vehicle.vehicleNumber} />
                    <p className="truncate text-xs text-slate-500">{makeAndModel(vehicle)}</p>
                  </div>
                  <AddedOn createdAt={vehicle.createdAt} align="right" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Badge tone={vehicleStatusTone(vehicle.status)}>
                    {vehicleStatusLabel(vehicle.status)}
                  </Badge>
                  <span className="truncate text-xs text-slate-600">
                    {vehicle.customer.fullName} · {vehicle.customer.mobileNumber}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ListPanel>
  )
}
