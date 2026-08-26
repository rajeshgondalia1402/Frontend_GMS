/**
 * Shared validation rules so every auth form enforces exactly the same
 * constraints as the Node.js API.
 */

export const MOBILE_LENGTH = 10
export const PASSWORD_MIN_LENGTH = 6 // "greater than 5"
export const PASSWORD_MAX_LENGTH = 24 // "less than 25"

/** Keeps only digits — used to block letters/symbols while typing. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Normalises what the user typed or pasted into at most 10 digits.
 * Pasting a formatted number is common, so a leading country code (+91) or a
 * trunk 0 is dropped rather than eating the first digits of the real number.
 */
export function normalizeMobileInput(raw: string): string {
  let digits = digitsOnly(raw)
  if (digits.length > MOBILE_LENGTH) {
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  }
  return digits.slice(0, MOBILE_LENGTH)
}

/** Returns an error message, or `undefined` when the value is valid. */
export function validateMobileNumber(value: string): string | undefined {
  const mobile = (value ?? '').trim()
  if (!mobile) return 'Mobile number is required'
  if (!/^\d+$/.test(mobile)) return 'Only digits are allowed'
  if (mobile.length !== MOBILE_LENGTH) return `Mobile number must be exactly ${MOBILE_LENGTH} digits`
  return undefined
}

export function validatePassword(value: string): string | undefined {
  const password = value ?? ''
  if (!password) return 'Password is required'
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`
  return undefined
}

/** react-hook-form rule objects. */
export const mobileNumberRules = {
  required: 'Mobile number is required',
  validate: (value: string) => validateMobileNumber(value) ?? true,
}

export const passwordRules = {
  required: 'Password is required',
  validate: (value: string) => validatePassword(value) ?? true,
}

/** Max lengths mirror the Zod schemas in the API's `auth.validation.js`. */
export const OWNER_NAME_MAX_LENGTH = 100
export const GARAGE_NAME_MAX_LENGTH = 150
export const CITY_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 150
export const OTP_LENGTH = 6

function requiredTextRules(label: string, maxLength: number) {
  return {
    required: `${label} is required`,
    validate: (value: string) => {
      const text = (value ?? '').trim()
      if (!text) return `${label} is required`
      if (text.length > maxLength) return `${label} must be at most ${maxLength} characters`
      return true
    },
  }
}

export const ownerNameRules = requiredTextRules('Owner name', OWNER_NAME_MAX_LENGTH)
export const garageNameRules = requiredTextRules('Garage name', GARAGE_NAME_MAX_LENGTH)
export const cityRules = requiredTextRules('City', CITY_MAX_LENGTH)

/** Email is optional, but must be valid when the user typed something. */
export const optionalEmailRules = {
  validate: (value: string) => {
    const email = (value ?? '').trim()
    if (!email) return true
    if (email.length > EMAIL_MAX_LENGTH) return `Email must be at most ${EMAIL_MAX_LENGTH} characters`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
    return true
  },
}

export function validateOtp(value: string): string | undefined {
  const otp = (value ?? '').trim()
  if (!otp) return 'Enter the verification code'
  if (!/^\d+$/.test(otp)) return 'The code contains only digits'
  if (otp.length !== OTP_LENGTH) return `Enter all ${OTP_LENGTH} digits`
  return undefined
}

/**
 * Change-password rules. The "must differ" and "must match" checks read the
 * sibling fields at validation time, so they stay correct as the user edits.
 */
export const currentPasswordRules = {
  required: 'Current password is required',
  validate: (value: string) => validatePassword(value) ?? true,
}

export function newPasswordRules(getCurrentPassword: () => string) {
  return {
    required: 'New password is required',
    validate: (value: string) => {
      const invalid = validatePassword(value)
      if (invalid) return invalid
      if (value === getCurrentPassword()) {
        return 'New password must be different from the current password'
      }
      return true
    },
  }
}

export function confirmPasswordRules(getNewPassword: () => string) {
  return {
    required: 'Please confirm your new password',
    validate: (value: string) => (value === getNewPassword() ? true : 'Passwords do not match'),
  }
}

/**
 * Customer form rules — mirror the schema behind `POST /api/auth/customer`.
 * Both numbers are the same 10-digit rule, but each names its own field so the
 * message points at the input the user is looking at.
 */
export const FULL_NAME_MAX_LENGTH = 100
export const ADDRESS_MAX_LENGTH = 255

export const fullNameRules = requiredTextRules('Full name', FULL_NAME_MAX_LENGTH)

export function validateWhatsappNumber(value: string): string | undefined {
  const whatsapp = (value ?? '').trim()
  if (!whatsapp) return 'WhatsApp number is required'
  if (!/^\d+$/.test(whatsapp)) return 'Only digits are allowed'
  if (whatsapp.length !== MOBILE_LENGTH) {
    return `WhatsApp number must be exactly ${MOBILE_LENGTH} digits`
  }
  return undefined
}

export const whatsappNumberRules = {
  required: 'WhatsApp number is required',
  validate: (value: string) => validateWhatsappNumber(value) ?? true,
}

/** Optional free text — blank is fine, only the max length is enforced. */
function optionalTextRules(label: string, maxLength: number) {
  return {
    validate: (value: string) => {
      const text = (value ?? '').trim()
      if (text.length > maxLength) return `${label} must be at most ${maxLength} characters`
      return true
    },
  }
}

export const optionalCityRules = optionalTextRules('City', CITY_MAX_LENGTH)
export const optionalAddressRules = optionalTextRules('Address', ADDRESS_MAX_LENGTH)

/**
 * Vehicle form rules — mirror the schema behind `POST /api/auth/vehicle`.
 */
export const VEHICLE_NUMBER_MIN_LENGTH = 5
export const VEHICLE_NUMBER_MAX_LENGTH = 15
export const DESCRIPTION_MAX_LENGTH = 255
export const BRAND_MAX_LENGTH = 60
export const MODEL_MAX_LENGTH = 60
export const VARIANT_MAX_LENGTH = 60
export const COLOR_MAX_LENGTH = 40
export const CURRENT_KM_MAX = 9999999

/**
 * The API stores the number normalised — uppercased with spaces and hyphens
 * removed — so the field shows exactly what will be saved while it is typed.
 */
export function normalizeVehicleNumber(raw: string): string {
  return (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, VEHICLE_NUMBER_MAX_LENGTH)
}

export function validateVehicleNumber(value: string): string | undefined {
  const number = normalizeVehicleNumber(value)
  if (!number) return 'Vehicle number is required'
  if (number.length < VEHICLE_NUMBER_MIN_LENGTH) {
    return `Vehicle number must be at least ${VEHICLE_NUMBER_MIN_LENGTH} characters`
  }
  return undefined
}

export const vehicleNumberRules = {
  required: 'Vehicle number is required',
  validate: (value: string) => validateVehicleNumber(value) ?? true,
}

export const vehicleTypeRules = {
  required: 'Vehicle type is required',
  validate: (value: string) => ((value ?? '').trim() ? true : 'Vehicle type is required'),
}

export const vehicleDescriptionRules = requiredTextRules('Description', DESCRIPTION_MAX_LENGTH)

/** Whole kilometres — the API stores an integer. */
export const currentKmRules = {
  required: 'Current km is required',
  validate: (value: string) => {
    const km = String(value ?? '').trim()
    if (!km) return 'Current km is required'
    if (!/^\d+$/.test(km)) return 'Enter whole kilometres, digits only'
    if (Number(km) > CURRENT_KM_MAX) {
      return `Current km must be at most ${CURRENT_KM_MAX.toLocaleString('en-IN')}`
    }
    return true
  },
}

export const optionalBrandRules = optionalTextRules('Brand', BRAND_MAX_LENGTH)
export const optionalModelRules = optionalTextRules('Model', MODEL_MAX_LENGTH)
export const optionalVariantRules = optionalTextRules('Variant', VARIANT_MAX_LENGTH)
export const optionalColorRules = optionalTextRules('Colour', COLOR_MAX_LENGTH)

/** Optional `YYYY-MM-DD`, as produced by an `<input type="date">`. */
export const insuranceExpiryRules = {
  validate: (value: string) => {
    const date = (value ?? '').trim()
    if (!date) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Enter a valid date'
    if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) return 'Enter a valid date'
    return true
  },
}
