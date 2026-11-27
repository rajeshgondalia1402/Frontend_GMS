import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Home, Mail, MapPin, MessageCircle, Phone, StickyNote, User, UserPlus } from 'lucide-react'
import { Input, Textarea } from '@/components/ui'
import { FormSection } from '@/components/common/FormSection'
import { cn } from '@/lib/utils'
import type { CustomerFormValues } from '@/lib/customerForm'
import {
  ADDRESS_MAX_LENGTH,
  CITY_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  MOBILE_LENGTH,
  fullNameRules,
  mobileNumberRules,
  normalizeMobileInput,
  optionalAddressRules,
  optionalCityRules,
  optionalEmailRules,
  whatsappNumberRules,
} from '@/lib/validation'

interface CustomerFieldsProps {
  form: UseFormReturn<CustomerFormValues>
  /** Column count of the plain (un-sectioned) layout used in the edit dialog. */
  columns?: 1 | 2 | 3
  /**
   * The full "Add Customer" page: the must-have contact details in one card
   * and the extras folded away in a second, so a walk-in is added in seconds.
   */
  sectioned?: boolean
}

/**
 * The customer fields shared by the add page and the edit dialog, including
 * the "same as mobile" mirroring, so both collect exactly what the API takes.
 */
export function CustomerFields({ form, columns = 3, sectioned = false }: CustomerFieldsProps) {
  const {
    register,
    setValue,
    getValues,
    clearErrors,
    watch,
    formState: { errors },
  } = form

  const sameAsMobile = watch('sameAsMobile')

  const mobileField = register('mobileNumber', mobileNumberRules)
  const whatsappField = register('whatsappNumber', whatsappNumberRules)
  const sameAsMobileField = register('sameAsMobile')

  /**
   * Copies the mobile number across. The mirrored value is never the user's
   * own typing, so a stale error on it would only confuse — submit revalidates.
   */
  const mirrorToWhatsapp = (mobile: string) => {
    setValue('whatsappNumber', mobile, { shouldDirty: true })
    clearErrors('whatsappNumber')
  }

  const onMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeMobileInput(e.target.value)
    void mobileField.onChange(e)
    if (getValues('sameAsMobile')) mirrorToWhatsapp(e.target.value)
  }

  const onWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = normalizeMobileInput(e.target.value)
    void whatsappField.onChange(e)
  }

  const onSameAsMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void sameAsMobileField.onChange(e)
    // Unticking leaves the copied number in place so it can be edited.
    if (e.target.checked) mirrorToWhatsapp(getValues('mobileNumber'))
  }

  const nameInput = (
    <Input
      label="Customer Name *"
      placeholder="e.g. Rahul Patel"
      autoComplete="name"
      maxLength={FULL_NAME_MAX_LENGTH}
      leftIcon={<User className="h-4 w-4" />}
      error={errors.fullName?.message}
      {...register('fullName', fullNameRules)}
    />
  )

  const mobileInput = (
    <Input
      label="Mobile Number *"
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="10-digit mobile number"
      maxLength={MOBILE_LENGTH}
      leftIcon={<Phone className="h-4 w-4" />}
      error={errors.mobileNumber?.message}
      {...mobileField}
      onChange={onMobileChange}
    />
  )

  /** A tappable row rather than a bare checkbox — it is the common case. */
  const sameAsMobileToggle = (
    <label
      htmlFor="sameAsMobile"
      className={cn(
        'flex min-h-[44px] cursor-pointer select-none items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
        sameAsMobile
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
      )}
    >
      <input
        id="sameAsMobile"
        type="checkbox"
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-emerald-600"
        {...sameAsMobileField}
        onChange={onSameAsMobileChange}
      />
      <MessageCircle className="h-4 w-4 shrink-0" />
      <span className="font-medium">WhatsApp is on this same mobile number</span>
    </label>
  )

  /** Only asked for when it differs — kept mounted so its rules still run. */
  const whatsappInput = (
    <div className={cn(sameAsMobile && 'hidden')}>
      <Input
        label="WhatsApp Number *"
        type="tel"
        inputMode="numeric"
        placeholder="10-digit WhatsApp number"
        maxLength={MOBILE_LENGTH}
        leftIcon={<MessageCircle className="h-4 w-4" />}
        hint="Bills and reminders are sent here"
        error={errors.whatsappNumber?.message}
        {...whatsappField}
        onChange={onWhatsappChange}
      />
    </div>
  )

  const emailInput = (
    <Input
      label="Email"
      type="email"
      placeholder="rahul@example.com"
      autoComplete="email"
      maxLength={EMAIL_MAX_LENGTH}
      leftIcon={<Mail className="h-4 w-4" />}
      error={errors.email?.message}
      {...register('email', optionalEmailRules)}
    />
  )

  const cityInput = (
    <Input
      label="City"
      placeholder="e.g. Ahmedabad"
      autoComplete="address-level2"
      maxLength={CITY_MAX_LENGTH}
      leftIcon={<MapPin className="h-4 w-4" />}
      error={errors.city?.message}
      {...register('city', optionalCityRules)}
    />
  )

  const addressInput = (
    <Textarea
      label="Address"
      placeholder="House no., street, area"
      rows={2}
      maxLength={ADDRESS_MAX_LENGTH}
      leftIcon={<Home className="h-4 w-4" />}
      error={errors.address?.message}
      {...register('address', optionalAddressRules)}
    />
  )

  const notesInput = (
    <Textarea
      label="Notes"
      placeholder="e.g. Regular customer, prefers weekend service"
      rows={2}
      leftIcon={<StickyNote className="h-4 w-4" />}
      {...register('notes')}
    />
  )

  if (sectioned) {
    const optionalHasError = Boolean(errors.email || errors.city || errors.address || errors.notes)

    return (
      <div className="space-y-4">
        <FormSection
          title="Customer contact"
          description="Only the name and mobile number are needed to get started."
          icon={UserPlus}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {nameInput}
            <div className="space-y-3">
              {mobileInput}
              {sameAsMobileToggle}
            </div>
            {whatsappInput}
          </div>
        </FormSection>

        <FormSection
          title="More details"
          badge="Optional"
          description="Email, city, address and notes — add now or any time later."
          icon={StickyNote}
          collapsible
          defaultOpen={false}
          forceOpen={optionalHasError}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {emailInput}
            {cityInput}
            {addressInput}
            {notesInput}
          </div>
        </FormSection>
      </div>
    )
  }

  const multi = columns > 1
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        columns === 2 && 'md:grid-cols-2',
        columns === 3 && 'md:grid-cols-2 xl:grid-cols-3',
      )}
    >
      {nameInput}
      <div className="space-y-3">
        {mobileInput}
        {sameAsMobileToggle}
      </div>
      {whatsappInput}
      {emailInput}
      {cityInput}
      {addressInput}
      <div className={multi ? 'md:col-span-2 xl:col-span-3' : undefined}>{notesInput}</div>
    </div>
  )
}
