import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Layers,
  Lock,
  Package,
  Pencil,
  Plus,
  PowerOff,
  Users,
} from 'lucide-react'
import { FilterCard, PageHeader, SearchInput } from '@/components/common'
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  useToast,
} from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCount } from '@/lib/dashboard'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ApiError } from '@/services/httpClient'
import { planService } from '@/services/planService'
import type { PlanListData, PlanRecord, PlanStatusFilter } from '@/types/plan'

/** There are only ever a handful of plans, so one request shows them all. */
const LIST_LIMIT = 100

/** Quick picks for the duration field; any whole number of days still works. */
const DURATION_PRESETS = [
  { days: 7, label: '1 week' },
  { days: 30, label: '1 month' },
  { days: 90, label: '3 months' },
  { days: 180, label: '6 months' },
  { days: 365, label: '1 year' },
]

/** `HALF_YEARLY` → `Half Yearly`, the way the plan reads to a person. */
function planTitle(name: string): string {
  return name
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** `365` → `1 year`, `90` → `3 months`, `45` → `45 days`. */
function durationLabel(days: number): string {
  if (days % 365 === 0) return days === 365 ? '1 year' : `${days / 365} years`
  if (days % 30 === 0) return days === 30 ? '1 month' : `${days / 30} months`
  if (days % 7 === 0) return days === 7 ? '1 week' : `${days / 7} weeks`
  return days === 1 ? '1 day' : `${days} days`
}

/**
 * What the plan costs per 30 days, so plans of different lengths compare at a
 * glance. Nothing for a free plan, or one that is already a month long.
 */
function perMonth(plan: PlanRecord): string | null {
  if (plan.price <= 0 || plan.durationDays === 30) return null
  const monthly = Math.round((plan.price / plan.durationDays) * 30)
  return `≈ ${formatCurrency(monthly)} / month`
}

/**
 * Active / inactive as a switch. System plans show it locked on — the API
 * will not switch them off, so the control says so before anyone tries.
 */
function StatusSwitch({
  plan,
  busy,
  onToggle,
}: {
  plan: PlanRecord
  busy: boolean
  onToggle: () => void
}) {
  const locked = plan.isSystemPlan && plan.isActive

  return (
    <button
      type="button"
      role="switch"
      aria-checked={plan.isActive}
      aria-label={`${planTitle(plan.name)} is ${plan.isActive ? 'active' : 'inactive'}`}
      title={
        locked
          ? 'System plan — always active'
          : plan.isActive
            ? 'Deactivate: new garages stop seeing this plan'
            : 'Activate: offer this plan to garages again'
      }
      disabled={locked || busy}
      onClick={onToggle}
      className={cn(
        'group inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
        locked ? 'cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-50',
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          plan.isActive ? 'bg-emerald-500' : 'bg-slate-300',
          locked && 'opacity-60',
          busy && 'animate-pulse',
        )}
      >
        <span
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform',
            plan.isActive ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        >
          {locked && <Lock className="h-3 w-3 text-slate-400" />}
        </span>
      </span>
      {plan.isActive ? 'Active' : 'Inactive'}
    </button>
  )
}

function PlanCard({
  plan,
  busy,
  onEdit,
  onToggle,
}: {
  plan: PlanRecord
  busy: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  const monthly = perMonth(plan)

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-white p-4 shadow-card',
        plan.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              plan.isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-200 text-slate-500',
            )}
          >
            <Package className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">{planTitle(plan.name)}</h3>
            <p className="truncate font-mono text-[11px] text-slate-400">{plan.name}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
          {plan.isSystemPlan && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Lock className="h-3 w-3" /> System
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {plan.price <= 0 ? 'Free' : formatCurrency(plan.price)}
          </span>
          <span className="text-sm text-slate-500">/ {durationLabel(plan.durationDays)}</span>
        </p>
        <p className="mt-0.5 h-4 text-xs text-slate-400">{monthly ?? ''}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <CalendarClock className="h-3 w-3" /> Duration
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-800">{formatCount(plan.durationDays)} days</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Users className="h-3 w-3" /> Taken
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-800">
            {formatCount(plan.subscriptionCount)} {plan.subscriptionCount === 1 ? 'time' : 'times'}
          </dd>
        </div>
      </dl>

      {!plan.isActive && plan.deactivatedAt && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <PowerOff className="h-3.5 w-3.5" /> Deactivated on {formatDate(plan.deactivatedAt)}
        </p>
      )}

      {/* Pinned to the bottom, so cards of different heights line their actions up. */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <StatusSwitch plan={plan} busy={busy} onToggle={onToggle} />
          <Button size="sm" variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PlanFormValues {
  name: string
  price: string
  durationDays: string
}

/** Add or edit one plan. `plan` null is a new one. */
function PlanFormModal({
  open,
  plan,
  onClose,
  onSaved,
}: {
  open: boolean
  plan: PlanRecord | null
  onClose: () => void
  onSaved: (plan: PlanRecord, created: boolean) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>()
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset(
      plan
        ? { name: planTitle(plan.name), price: String(plan.price), durationDays: String(plan.durationDays) }
        : { name: '', price: '', durationDays: '30' },
    )
  }, [open, plan, reset])

  const nameLocked = Boolean(plan?.isSystemPlan)
  // The API keeps the free trial at ₹0; the field says so rather than 400ing.
  const priceLocked = plan?.name === 'FREE_TRIAL'
  const duration = Number(watch('durationDays'))

  const onSubmit = async (values: PlanFormValues) => {
    setFormError(null)
    const payload = {
      ...(nameLocked ? {} : { name: values.name.trim() }),
      ...(priceLocked ? {} : { price: Number(values.price) }),
      durationDays: Number(values.durationDays),
    }

    try {
      const saved = plan
        ? await planService.updatePlan(plan.planId, payload)
        : await planService.createPlan(payload as { name: string; price: number; durationDays: number })
      onSaved(saved, !plan)
    } catch (err) {
      if (err instanceof ApiError) {
        // Field messages from a 400 go under their fields; a name clash (409)
        // under the name; anything else above the form.
        for (const { field, message } of err.fieldErrors) {
          if (field === 'name' || field === 'price' || field === 'durationDays') {
            setError(field, { message })
          }
        }
        if (err.status === 409) setError('name', { message: err.message })
        else if (err.fieldErrors.length === 0) setFormError(err.message)
      } else {
        setFormError('Could not save the plan. Please try again.')
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={plan ? `Edit ${planTitle(plan.name)}` : 'Add Subscription Plan'}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button fullWidth loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            {plan ? 'Save Changes' : 'Add Plan'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
        )}

        <Input
          label="Plan Name"
          placeholder="Half Yearly"
          leftIcon={<Package className="h-4 w-4" />}
          disabled={nameLocked}
          error={errors.name?.message}
          hint={
            nameLocked
              ? 'System plan — the name cannot change.'
              : 'Saved in capitals with underscores, e.g. HALF_YEARLY.'
          }
          {...register('name', {
            validate: (value) =>
              nameLocked || value.trim().length > 0 || 'Plan name is required',
            maxLength: { value: 30, message: 'At most 30 characters' },
          })}
        />

        <Input
          label="Price (₹)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="499"
          leftIcon={<IndianRupee className="h-4 w-4" />}
          disabled={priceLocked}
          error={errors.price?.message}
          hint={priceLocked ? 'The free trial always stays free.' : undefined}
          {...register('price', {
            validate: (value) => {
              if (priceLocked) return true
              if (value.trim() === '') return 'Price is required'
              const amount = Number(value)
              if (!Number.isFinite(amount) || amount < 0) return 'Enter a price of 0 or more'
              return true
            },
          })}
        />

        <div>
          <Input
            label="Duration (days)"
            type="number"
            inputMode="numeric"
            min={1}
            max={3650}
            step={1}
            placeholder="30"
            leftIcon={<CalendarClock className="h-4 w-4" />}
            error={errors.durationDays?.message}
            hint={Number.isInteger(duration) && duration > 0 ? `About ${durationLabel(duration)}` : undefined}
            {...register('durationDays', {
              validate: (value) => {
                const days = Number(value)
                if (value.trim() === '') return 'Duration is required'
                if (!Number.isInteger(days) || days < 1) return 'Enter a whole number of days, 1 or more'
                if (days > 3650) return 'At most 3650 days'
                return true
              },
            })}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setValue('durationDays', String(preset.days), { shouldValidate: true })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  duration === preset.days
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-700',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Subscription Plans — every plan, active and inactive, as cards. Plans are
 * added and edited in a form, and switched active / inactive rather than
 * deleted: an inactive plan stops being offered to new garages while every
 * subscription already taken on it carries on.
 */
export function AdminPlans() {
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const [status, setStatus] = useState<PlanStatusFilter>('all')

  const [data, setData] = useState<PlanListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const latestRequest = useRef(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlanRecord | null>(null)
  const [confirming, setConfirming] = useState<PlanRecord | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current
    setLoading(true)
    setError(null)
    try {
      const result = await planService.listPlans({
        limit: LIST_LIMIT,
        status,
        ...(search ? { search } : {}),
      })
      if (requestId !== latestRequest.current) return
      setData(result)
    } catch (err) {
      if (requestId !== latestRequest.current) return
      setError(err instanceof ApiError ? err.message : 'Could not load subscription plans.')
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    void load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (plan: PlanRecord) => {
    setEditing(plan)
    setFormOpen(true)
  }

  const changeStatus = async (plan: PlanRecord, isActive: boolean) => {
    setBusyId(plan.planId)
    try {
      await planService.setPlanStatus(plan.planId, isActive)
      toast(
        isActive ? `${planTitle(plan.name)} is active again` : `${planTitle(plan.name)} deactivated`,
        'success',
      )
      await load()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not change the plan status', 'error')
    } finally {
      setBusyId(null)
    }
  }

  // Switching off asks first; switching back on is harmless and happens at once.
  const toggle = (plan: PlanRecord) =>
    plan.isActive ? setConfirming(plan) : void changeStatus(plan, true)

  const plans = data?.plans ?? []
  const counts = data?.counts

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle="Create, edit and switch the plans garages can subscribe to"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            <span className="hidden sm:inline">Add Plan</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterCard
          icon={Layers}
          label="All plans"
          tone="primary"
          value={counts ? formatCount(counts.all) : '—'}
          selected={status === 'all'}
          onClick={() => setStatus('all')}
        />
        <FilterCard
          icon={CheckCircle2}
          label="Active"
          hint="Offered to new garages"
          tone="success"
          value={counts ? formatCount(counts.active) : '—'}
          selected={status === 'active'}
          onClick={() => setStatus('active')}
        />
        <FilterCard
          icon={PowerOff}
          label="Inactive"
          hint="Hidden from new garages"
          tone="neutral"
          value={counts ? formatCount(counts.inactive) : '—'}
          selected={status === 'inactive'}
          onClick={() => setStatus('inactive')}
        />
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search plans by name..."
        className="mb-4"
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState title="Could not load plans" description={error} onRetry={() => void load()} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? 'No plans match' : status === 'inactive' ? 'No inactive plans' : 'No plans yet'}
          description={
            search
              ? 'Try a different name.'
              : status === 'inactive'
                ? 'Every plan is on offer to garages.'
                : 'Add the first plan garages can subscribe to.'
          }
        />
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              busy={busyId === plan.planId}
              onEdit={() => openEdit(plan)}
              onToggle={() => toggle(plan)}
            />
          ))}
        </div>
      )}

      <PlanFormModal
        open={formOpen}
        plan={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, created) => {
          setFormOpen(false)
          toast(
            created ? `${planTitle(saved.name)} plan added` : `${planTitle(saved.name)} plan updated`,
            'success',
          )
          void load()
        }}
      />

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void changeStatus(confirming, false)
        }}
        title={confirming ? `Deactivate ${planTitle(confirming.name)}?` : 'Deactivate plan?'}
        message="New garages will no longer be able to choose this plan. Garages already on it keep their subscription, and you can activate it again at any time."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  )
}
