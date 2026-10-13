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

/** Optional whole kilometres — the API stores an integer, or nothing at all. */
export const currentKmRules = {
  validate: (value: string) => {
    const km = String(value ?? '').trim()
    if (!km) return true
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

/**
 * Staff form rules — mirror the schema behind `POST /api/auth/staff`.
 * Only the name, the category and the mobile number are required; the job
 * title and the pay may both be left for later.
 */
export const STAFF_NAME_MAX_LENGTH = 100
export const STAFF_ROLE_MAX_LENGTH = 100
/** The API rejects anything above this, or with more than 2 decimal places. */
export const MONTHLY_SALARY_MAX = 99999999.99

export const staffNameRules = requiredTextRules('Name', STAFF_NAME_MAX_LENGTH)
export const optionalStaffRoleRules = optionalTextRules('Role', STAFF_ROLE_MAX_LENGTH)

export const staffCategoryRules = {
  required: 'Category is required',
  validate: (value: string) => ((value ?? '').trim() ? true : 'Category is required'),
}

/** Only asked for while editing; adding someone always starts them `ACTIVE`. */
export const staffStatusRules = {
  required: 'Status is required',
  validate: (value: string) => ((value ?? '').trim() ? true : 'Status is required'),
}

/** Optional: blank means the pay has not been agreed yet and is not sent. */
export const monthlySalaryRules = {
  validate: (value: string) => {
    const salary = String(value ?? '').trim()
    if (!salary) return true
    // One test for all three API rules: not negative, digits, at most 2 decimals.
    if (!/^\d+(\.\d{1,2})?$/.test(salary)) {
      return 'Enter a positive amount with at most 2 decimal places'
    }
    if (Number(salary) > MONTHLY_SALARY_MAX) {
      return `Monthly salary must be at most ${MONTHLY_SALARY_MAX.toLocaleString('en-IN')}`
    }
    return true
  },
}

/**
 * Admin password rules — the platform admin is a different account type with a
 * different limit: `POST /api/admin/change-password` takes 6 to 72 characters,
 * where a garage owner's password stops at 24.
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 6
export const ADMIN_PASSWORD_MAX_LENGTH = 72

export function validateAdminPassword(value: string): string | undefined {
  const password = value ?? ''
  if (!password) return 'Password is required'
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`
  }
  if (password.length > ADMIN_PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${ADMIN_PASSWORD_MAX_LENGTH} characters`
  }
  return undefined
}

/**
 * Sign-in only checks that something was typed: the stored password was set
 * under whatever rules applied then, and only the API can say whether it fits.
 */
export const enteredPasswordRules = {
  required: 'Password is required',
  validate: (value: string) => ((value ?? '').length > 0 ? true : 'Password is required'),
}

/** Same reasoning for the current password on the admin change-password form. */
export const adminCurrentPasswordRules = {
  required: 'Current password is required',
  validate: (value: string) =>
    (value ?? '').length > 0 ? true : 'Current password is required',
}

export function adminNewPasswordRules(getCurrentPassword: () => string) {
  return {
    required: 'New password is required',
    validate: (value: string) => {
      const invalid = validateAdminPassword(value)
      if (invalid) return invalid
      if (value === getCurrentPassword()) {
        return 'New password must be different from the current password'
      }
      return true
    },
  }
}

/**
 * Car selling form rules — mirror the schema behind `POST /api/auth/car-selling`.
 * Only the owner's name, mobile number and fuel type are required.
 */
export const CAR_OWNER_NAME_MAX_LENGTH = 100
export const CAR_ADDRESS_MAX_LENGTH = 250
export const CAR_TYPE_MAX_LENGTH = 30
export const CAR_COMPANY_MAX_LENGTH = 50
export const CAR_COLOR_MAX_LENGTH = 30
export const CAR_DESCRIPTION_MAX_LENGTH = 255
export const CAR_YEAR_MIN = 1900
export const CAR_PREVIOUS_OWNERS_MAX = 20
export const SELLING_PRICE_MAX = 99999999.99

/** The API takes a year up to next year — a new model is sold before it starts. */
export const carYearMax = () => new Date().getFullYear() + 1

export const carOwnerNameRules = requiredTextRules('Owner name', CAR_OWNER_NAME_MAX_LENGTH)
export const optionalCarAddressRules = optionalTextRules('Address', CAR_ADDRESS_MAX_LENGTH)
export const optionalCarTypeRules = optionalTextRules('Car name', CAR_TYPE_MAX_LENGTH)
export const optionalCarCompanyRules = optionalTextRules('Company', CAR_COMPANY_MAX_LENGTH)
export const optionalCarColorRules = optionalTextRules('Car color', CAR_COLOR_MAX_LENGTH)

/**
 * Every car put up for sale is identified by its registration number, which
 * is normalised and length checked exactly like a vehicle's.
 */
export const carNumberRules = {
  required: 'Car number is required',
  validate: (value: string) => {
    const number = normalizeVehicleNumber(value)
    if (!number) return 'Car number is required'
    if (number.length < VEHICLE_NUMBER_MIN_LENGTH) {
      return `Car number must be at least ${VEHICLE_NUMBER_MIN_LENGTH} characters`
    }
    return true
  },
}
export const optionalCarDescriptionRules = optionalTextRules(
  'Description',
  CAR_DESCRIPTION_MAX_LENGTH,
)

/** The one car detail that has to be picked — the API refuses a car without it. */
export const fuelTypeRules = {
  required: 'Fuel type is required',
  validate: (value: string) => ((value ?? '').trim() ? true : 'Fuel type is required'),
}

export const yearOfVehicleRules = {
  validate: (value: string) => {
    const year = String(value ?? '').trim()
    if (!year) return true
    if (!/^\d{4}$/.test(year)) return 'Enter a 4 digit year'
    const max = carYearMax()
    if (Number(year) < CAR_YEAR_MIN || Number(year) > max) {
      return `Year must be between ${CAR_YEAR_MIN} and ${max}`
    }
    return true
  },
}

/**
 * Required on the form, although the API would take a car with no price: a
 * listing is not put up until the garage knows what it is asking for it.
 */
export const sellingPriceRules = {
  required: 'Selling price is required',
  validate: (value: string) => {
    const price = String(value ?? '').trim()
    if (!price) return 'Selling price is required'
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      return 'Enter a positive amount with at most 2 decimal places'
    }
    if (Number(price) <= 0) return 'Selling price must be more than 0'
    if (Number(price) > SELLING_PRICE_MAX) {
      return `Selling price must be at most ${SELLING_PRICE_MAX.toLocaleString('en-IN')}`
    }
    return true
  },
}

/**
 * Car sold form rules — mirror the schema behind
 * `POST /api/auth/car-selling/:id/sold-customer`.
 *
 * The car, the final price, the buyer's name and the buyer's mobile number are
 * required; the address is not, and the delivered status always has a value
 * because the dropdown starts on Pending.
 */
export const PURCHASE_OWNER_NAME_MAX_LENGTH = 100
export const PURCHASE_OWNER_ADDRESS_MAX_LENGTH = 250

export const carSoldCarRules = {
  required: 'Select the car that was sold',
  validate: (value: string) => ((value ?? '').trim() ? true : 'Select the car that was sold'),
}

export const purchaseOwnerNameRules = requiredTextRules(
  'Buyer name',
  PURCHASE_OWNER_NAME_MAX_LENGTH,
)

export const optionalPurchaseOwnerAddressRules = optionalTextRules(
  'Buyer address',
  PURCHASE_OWNER_ADDRESS_MAX_LENGTH,
)

/**
 * What the car actually went for — the price the payments against this sale
 * are measured against, so it may not be 0 or left blank. Same DECIMAL(10,2)
 * bounds as the listing's asking price.
 */
export const finalSellingPriceRules = {
  required: 'Final selling price is required',
  validate: (value: string) => {
    const price = String(value ?? '').trim()
    if (!price) return 'Final selling price is required'
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      return 'Enter a positive amount with at most 2 decimal places'
    }
    if (Number(price) <= 0) return 'Final selling price must be more than 0'
    if (Number(price) > SELLING_PRICE_MAX) {
      return `Final selling price must be at most ${SELLING_PRICE_MAX.toLocaleString('en-IN')}`
    }
    return true
  },
}

/**
 * The day the car was handed over. Optional — left blank on a delivered sale
 * the API stamps today — but it can never be in the future, and the API only
 * accepts it at all while the status is Delivered.
 */
export const deliveredDateRules = {
  validate: (value: string) => {
    const date = String(value ?? '').trim()
    if (!date) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Enter a valid date'

    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${now.getFullYear()}-${month}-${day}`

    return date > today ? 'Delivered date cannot be in the future' : true
  },
}

/**
 * The money taken at the counter. Never 0, and never more than the car went
 * for: the API refuses a receipt bigger than `finalSellingPrice`, and a buyer
 * who hands over more than the price is owed change, not a bigger sale. Pass
 * `required` where the amount may not be left blank.
 *
 * `max` is read when the rule runs rather than captured, so typing a different
 * final price re-checks the amount against it.
 */
export function carSoldPaymentRules(
  max: () => number,
  label = 'Payment amount',
  required = false,
) {
  return {
    validate: (value: string) => {
      const amount = String(value ?? '').trim()
      if (!amount) return required ? `${label} is required` : true
      if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
        return 'Enter a positive amount with at most 2 decimal places'
      }
      if (Number(amount) <= 0) return `${label} must be more than 0`

      const limit = max()
      if (limit > 0 && Number(amount) > limit) {
        return `${label} cannot be more than ${limit.toLocaleString('en-IN')}`
      }
      return true
    },
  }
}
