/** Types mirroring the Node.js API contract for `POST /api/auth/login`. */

export interface LoginPayload {
  mobileNumber: string
  password: string
}

export interface AuthUser {
  id: string
  ownerName: string
  mobileNumber: string
  garageName: string
  city?: string
  email?: string
}

export interface AuthSubscription {
  planID: number
  plan: string
  price: number
  status: string
  startDate: string
  endDate: string
}

export interface LoginData {
  token: string
  /** Human readable token lifetime returned by the API, e.g. `"30d"`. */
  expiresIn: string
  /** ISO timestamp at which the token stops being valid. */
  expiresAt: string
  user: AuthUser
  subscription?: AuthSubscription | null
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
}

/** Registration returns the new user, but no token — we log in right after. */
export interface RegisterData {
  user: AuthUser
  subscription?: AuthSubscription | null
}

export interface GenerateOtpData {
  mobileNumber: string
}

export interface VerifyOtpData {
  mobileNumber: string
  verified: boolean
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
export interface ForgotPasswordData {
  mobileNumber: string
}

/** `POST /api/auth/reset-password` — step 2, the OTP is the proof. */
export interface ResetPasswordPayload {
  mobileNumber: string
  otp: string
  newPassword: string
}

export interface ResetPasswordData {
  id: string
  mobileNumber: string
  passwordChangedAt: string
}
