import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { MessageCircle, Phone } from 'lucide-react'
import { Checkbox, Input, Textarea } from '@/components/ui'
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
  /** Single column inside the edit dialog, two on the full page. */
  columns?: 1 | 2
}

/**
 * The customer fields shared by the add page and the edit dialog, including
 * the "same as mobile" mirroring, so both collect exactly what the API takes.
 */
export function CustomerFields({ form, columns = 2 }: CustomerFieldsProps) {
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

  const wide = columns === 2 ? 'md:col-span-2' : undefined

  return (
    <div className={cn('grid grid-cols-1 gap-4', columns === 2 && 'md:grid-cols-2')}>
      <div className={wide}>
        <Input
          label="Customer Name *"
          placeholder="Rahul Patel"
          autoComplete="name"
          maxLength={FULL_NAME_MAX_LENGTH}
          error={errors.fullName?.message}
          {...register('fullName', fullNameRules)}
        />
      </div>

      <Input
        label="Mobile Number *"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="9876543210"
        maxLength={MOBILE_LENGTH}
        leftIcon={<Phone className="h-4 w-4" />}
        error={errors.mobileNumber?.message}
        {...mobileField}
        onChange={onMobileChange}
      />

      <Input
        label="WhatsApp Number *"
        type="tel"
        inputMode="numeric"
        placeholder="9876543210"
        maxLength={MOBILE_LENGTH}
        leftIcon={<MessageCircle className="h-4 w-4" />}
        readOnly={sameAsMobile}
        className={sameAsMobile ? 'bg-slate-50 text-slate-500' : undefined}
        error={errors.whatsappNumber?.message}
        {...whatsappField}
        onChange={onWhatsappChange}
      />

      <div className={cn('-mt-1', wide)}>
        <Checkbox
          label="WhatsApp number is the same as the mobile number"
          {...sameAsMobileField}
          onChange={onSameAsMobileChange}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="rahul@example.com"
        autoComplete="email"
        maxLength={EMAIL_MAX_LENGTH}
        hint="Optional"
        error={errors.email?.message}
        {...register('email', optionalEmailRules)}
      />

      <Input
        label="City"
        placeholder="Ahmedabad"
        autoComplete="address-level2"
        maxLength={CITY_MAX_LENGTH}
        hint="Optional"
        error={errors.city?.message}
        {...register('city', optionalCityRules)}
      />

      <div className={wide}>
        <Textarea
          label="Address"
          placeholder="Street, area, city"
          maxLength={ADDRESS_MAX_LENGTH}
          error={errors.address?.message}
          {...register('address', optionalAddressRules)}
        />
      </div>

      <div className={wide}>
        <Textarea
          label="Notes"
          placeholder="Regular customer, prefers weekend service..."
          {...register('notes')}
        />
      </div>
    </div>
  )
}
