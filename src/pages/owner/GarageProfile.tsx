import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Wrench, Camera } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { Button, Input, Textarea, Card, ErrorState, Skeleton, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/httpClient'
import { getInitial } from '@/lib/utils'
import type { ProfileUser } from '@/types/auth'

interface ProfileValues {
  garageName: string
  ownerName: string
  mobileNumber: string
  email: string
  city: string
  address: string
  gstNo: string
  workingDays: string
  workingHours: string
}

const EMPTY: ProfileValues = {
  garageName: '',
  ownerName: '',
  mobileNumber: '',
  email: '',
  city: '',
  address: '',
  gstNo: '',
  workingDays: '',
  workingHours: '',
}

/** `GET /auth/me` returns `null` for fields the owner has not filled in yet. */
function toFormValues(user: ProfileUser): ProfileValues {
  return {
    garageName: user.garageName ?? '',
    ownerName: user.ownerName ?? '',
    mobileNumber: user.mobileNumber ?? '',
    email: user.email ?? '',
    city: user.city ?? '',
    address: user.address ?? '',
    gstNo: user.gstNo ?? '',
    workingDays: user.workingDays ?? '',
    workingHours: user.workingHours ?? '',
  }
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={i === 0 ? 'md:col-span-2' : undefined}>
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function GarageProfile() {
  const { toast } = useToast()
  const { user: sessionUser, syncProfile } = useAuth()

  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset } = useForm<ProfileValues>({
    // Seed from the login session so the fields are never blank while /me loads.
    defaultValues: sessionUser ? toFormValues(sessionUser) : EMPTY,
  })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { user, subscription } = await authService.getProfile()
      reset(toFormValues(user))
      setLogo(user.logo ?? null)
      // Keep the topbar, dashboard and subscription pill on the same data.
      syncProfile(user, subscription)
    } catch (err) {
      // A 401 already triggers a global sign-out; anything else is shown here.
      setError(err instanceof ApiError ? err.message : 'Could not load your profile.')
    } finally {
      setLoading(false)
    }
  }, [reset, syncProfile])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const onSubmit = () => {
    // The API has no profile-update endpoint yet — still a mock submission.
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast('Profile saved', 'success')
    }, 800)
  }

  return (
    <div>
      <PageHeader title="Garage Profile" subtitle="Your garage details" />

      {loading ? (
        <ProfileSkeleton />
      ) : error ? (
        <div className="max-w-2xl">
          <ErrorState title="Could not load your profile" description={error} onRetry={() => void loadProfile()} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
          {/* Logo */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-primary-600 text-white">
                  {logo ? (
                    <img src={logo} alt="Garage logo" className="h-full w-full object-cover" />
                  ) : sessionUser?.garageName ? (
                    <span className="text-2xl font-bold">{getInitial(sessionUser.garageName)}</span>
                  ) : (
                    <Wrench className="h-7 w-7" />
                  )}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-700"
                  aria-label="Change logo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Garage Logo</p>
                <p className="text-sm text-slate-500">PNG or JPG, up to 2MB</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input label="Garage Name" {...register('garageName')} />
              </div>
              <Input label="Owner Name" {...register('ownerName')} />
              <Input
                label="Mobile Number"
                type="tel"
                inputMode="numeric"
                readOnly
                hint="Used to sign in — cannot be changed here."
                className="bg-slate-50 text-slate-600"
                {...register('mobileNumber')}
              />
              <Input label="Email" type="email" {...register('email')} />
              <Input label="City" {...register('city')} />
              <Input label="GST Number" {...register('gstNo')} />
              <div className="md:col-span-2">
                <Textarea label="Address" {...register('address')} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Working Hours</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Working Days" {...register('workingDays')} />
              <Input label="Hours" {...register('workingHours')} />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" fullWidth className="lg:w-auto lg:flex-none" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
