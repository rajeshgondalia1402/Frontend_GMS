/** Types mirroring the Node.js API contract for `POST /api/auth/login`. */

export interface LoginPayload {
  mobileNumber: string
  password: string
}

/**
 * One plan from `GET /api/subscription/plans` — what a garage can buy. The free
 * trial is never in the list (each number gets it once, at registration).
 */
export interface RenewalPlan {
  planId: number
  /** `MONTHLY`, `YEARLY`, ... */
  name: string
  price: number
  durationDays: number
  currency?: string
}

/** Account lifecycle, separate from the subscription. */
export type AccountStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DELETION_PENDING'
  | 'DELETED'

export interface AuthUser {
  id: string
  ownerName: string
  mobileNumber: string
  garageName: string
  city?: string
  email?: string
  countryCode?: string
  accountStatus?: AccountStatus
}

export interface AuthSubscription {
  id?: string
  planID: number
  plan: string
  price: number
  durationDays?: number
  /** ACTIVE | SCHEDULED | EXPIRED | CANCELLED | ... */
  status: string
  startDate: string
  endDate: string
  autoRenew?: boolean
}

/** What the garage may do right now — `access` on login, /me and /subscription/current. */
export type AccessStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'NO_SUBSCRIPTION'

export interface AuthAccess {
  /** True only with a live subscription; false sends the garage to the plans. */
  hasAccess: boolean
  status: AccessStatus
  /** Why there is no access, e.g. "Your free trial has ended...". */
  message: string | null
  isFreeTrial?: boolean
  /** The live period, or the last one that ran. */
  subscription: AuthSubscription | null
  /** Paid periods that start later (a renewal bought before the end date). */
  upcoming: AuthSubscription[]
  freeTrialUsed?: boolean
}

export interface LoginData {
  token: string
  /** Human readable token lifetime returned by the API, e.g. `"30d"`. */
  expiresIn: string
  /** ISO timestamp at which the token stops being valid. */
  expiresAt: string
  user: AuthUser
  subscription?: AuthSubscription | null
  access?: AuthAccess
}

/** Envelope used by every endpoint of the API. */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  /** Present on 400 validation failures. */
  errors?: ApiFieldError[]
}

/** What we persist locally so a refresh keeps the user signed in. */
export interface AuthSession {
  token: string
  expiresIn: string
  expiresAt: string
  user: AuthUser
  subscription: AuthSubscription | null
  /** Missing on sessions stored before the billing flow existed. */
  access?: AuthAccess | null
}

/** The fuller profile returned by `GET /api/auth/me` (adds garage details). */
export interface ProfileUser extends AuthUser {
  workingDays?: string | null
  workingHours?: string | null
  address?: string | null
  logo?: string | null
  gstNo?: string | null
}

export interface ProfileData {
  user: ProfileUser
  subscription: AuthSubscription | null
  access?: AuthAccess
}

/** One entry of the `errors` array on a 400 "Validation failed." response. */
export interface ApiFieldError {
  field: string
  message: string
}

/** `POST /api/auth/register` — `email` is the only optional field. */
export interface RegisterPayload {
  ownerName: string
  mobileNumber: string
  password: string
  garageName: string
  city: string
  email?: string
  /** From verify-otp in this same registration; single use, never stored. */
  verificationId: string
}

/** Registration returns the new user, but no token — we log in right after. */
export interface RegisterData {
  user: AuthUser
  subscription?: AuthSubscription | null
}

/** `POST /api/auth/check-mobile` */
export interface CheckMobileData {
  mobileNumber: string
  registered: boolean
  /** REGISTER: continue sign-up. LOGIN: the number already has an account. */
  nextStep: 'REGISTER' | 'LOGIN'
  message?: string
}

export interface GenerateOtpData {
  mobileNumber: string
  /** Identifies this OTP; verify-otp must be sent the same id. */
  challengeId: string
  /** Server-side validity of the code. */
  expiresInSeconds: number
  /** Server-enforced wait before "Send OTP again". */
  resendAfterSeconds: number
}

export interface VerifyOtpData {
  mobileNumber: string
  verified: boolean
  /** Pass to `/auth/register` — proves this number was just verified. */
  verificationId: string
}

/** `data` on an OTP error response — `code` says what went wrong. */
export interface OtpErrorData {
  code?: string
  retryAfterSeconds?: number
  attemptsLeft?: number
  /** Present on OTP_SEND_UNCONFIRMED: the SMS may still arrive. */
  challengeId?: string
  expiresInSeconds?: number
}

/** `POST /api/auth/change-password` — the user id comes from the token. */
export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordData {
  id: string
  mobileNumber: string
  passwordChangedAt: string
}

/** `POST /api/auth/forgot-password` — step 1, sends an OTP to a known number. */
export type ForgotPasswordData = GenerateOtpData

/** `POST /api/auth/reset-password` — step 2, the OTP is the proof. */
export interface ResetPasswordPayload {
  mobileNumber: string
  otp: string
  newPassword: string
  /** From forgot-password; ties the code to this reset. */
  challengeId?: string
}

export interface ResetPasswordData {
  id: string
  mobileNumber: string
  passwordChangedAt: string
}

/** Page envelope returned by the paginated collection endpoints. */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
