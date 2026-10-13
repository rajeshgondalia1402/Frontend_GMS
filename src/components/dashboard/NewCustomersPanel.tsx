import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, ChevronRight, MapPin, Phone, UserPlus } from 'lucide-react'
import { useDashboardPage } from '@/hooks/useDashboardPage'
import { getDashboardNewCustomers } from '@/services/dashboardService'
import { monthLabel } from '@/lib/dashboard'
import { cn } from '@/lib/utils'
import type { DashboardNewCustomer } from '@/types/dashboard'
import {
  AddedOn,
  Avatar,
  ListPanel,
  NEW_TAB,
  PANEL_PAGE_SIZE,
  openInNewTab,
  panelRowHover,
} from './ListPanel'

/** The vehicle numbers as chips, with "+2" for the ones the row leaves out. */
function VehicleChips({ customer }: { customer: DashboardNewCustomer }) {
  if (customer.vehicleCount === 0) {
    return <span className="text-xs italic text-slate-400">No vehicle yet</span>
  }

  const hidden = customer.vehicleCount - customer.vehicles.length

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {customer.vehicles.map((vehicle) => (
        <span
          key={vehicle.id}
          title={[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || undefined}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-slate-700"
        >
          <Car className="h-3 w-3 text-slate-400" />
          {vehicle.vehicleNumber}
        </span>
      ))}
      {hidden > 0 && (
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
          +{hidden}
        </span>
      )}
    </div>
  )
}

/**
 * The rows behind the "New Customers" tile: a page of the customers written up
 * this month, newest first, each one opening its own customer screen.
 */
export function NewCustomersPanel() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PANEL_PAGE_SIZE)

  const { data, loading, error, reload } = useDashboardPage(
    getDashboardNewCustomers,
    page,
    limit,
    'Could not load new customers.',
  )
  const customers = data?.customers ?? []

  const open = (id: string) => openInNewTab(`/app/customers/${id}`)

  return (
    <ListPanel
      tone="primary"
      icon={UserPlus}
      title="New Customers"
      subtitle={`Added in ${monthLabel(data?.month)} · from the 1st to today`}
      viewAll={{ to: '/app/customers', label: 'All customers' }}
      empty={{
        title: 'No new customers this month yet',
        description: 'Customers you add from the 1st of the month will show up here.',
        action: { to: '/app/customers/new', label: 'Add customer' },
      }}
      loading={loading}
      error={error}
      onRetry={reload}
      pagination={data?.pagination ?? null}
      count={customers.length}
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
            <th className="px-5 py-2.5">Customer</th>
            <th className="px-3 py-2.5">Contact</th>
            <th className="px-3 py-2.5">Vehicles</th>
            <th className="px-3 py-2.5">Added</th>
            <th className="w-10 px-3 py-2.5" aria-label="Open" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              onClick={() => open(customer.id)}
              className={cn('group cursor-pointer transition-colors', panelRowHover('primary'))}
            >
              <td className="px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={customer.fullName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                      {customer.fullName}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                      {customer.city ? (
                        <>
                          <MapPin className="h-3 w-3 shrink-0" /> {customer.city}
                        </>
                      ) : (
                        (customer.email ?? '—')
                      )}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">
                <a
                  href={`tel:${customer.mobileNumber}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-primary-700"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {customer.mobileNumber}
                </a>
              </td>
              <td className="px-3 py-3">
                <VehicleChips customer={customer} />
              </td>
              <td className="px-3 py-3">
                <AddedOn createdAt={customer.createdAt} />
              </td>
              <td className="px-3 py-3">
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stacked rows on a phone */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link
              {...NEW_TAB}
              to={`/app/customers/${customer.id}`}
              className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
            >
              <Avatar name={customer.fullName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {customer.fullName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3 w-3" /> {customer.mobileNumber}
                    </p>
                  </div>
                  <AddedOn createdAt={customer.createdAt} align="right" />
                </div>
                <div className="mt-2">
                  <VehicleChips customer={customer} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ListPanel>
  )
}
