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
