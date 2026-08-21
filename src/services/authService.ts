import { apiRequest } from './httpClient'
import type {
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
  ResetPasswordPayload,
  ChangePasswordPayload,
  GenerateOtpData,
  LoginData,
  LoginPayload,
  ProfileData,
  RegisterData,
  RegisterPayload,
  VerifyOtpData,
} from '@/types/auth'

/** `POST /api/auth/login` — returns the token, its expiry and the owner profile. */
export function login(payload: LoginPayload): Promise<LoginData> {
  return apiRequest<LoginData>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

/**
 * `POST /api/auth/generate-otp` — sends a fresh 6-digit code by SMS, valid for
 * 10 minutes. Calling it again replaces the previous code ("Send OTP again").
 * Rejects with 409 when the mobile number is already registered.
 */
export function generateOtp(mobileNumber: string): Promise<GenerateOtpData> {
  return apiRequest<GenerateOtpData>('/auth/generate-otp', {
    method: 'POST',
    body: { mobileNumber },
    auth: false,
  })
}

/** `POST /api/auth/verify-otp` — checks the code against the newest one issued. */
export function verifyOtp(mobileNumber: string, otp: string): Promise<VerifyOtpData> {
  return apiRequest<VerifyOtpData>('/auth/verify-otp', {
    method: 'POST',
    body: { mobileNumber, otp },
    auth: false,
  })
}

/**
 * `POST /api/auth/register` — requires the mobile number to be OTP-verified
 * first. Returns the new user but no token, so the caller logs in afterwards.
 */
export function register(payload: RegisterPayload): Promise<RegisterData> {
  return apiRequest<RegisterData>('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

/**
 * `POST /api/auth/forgot-password` — step 1 of the reset flow. Sends an OTP to
 * a number that is already registered; 404 when it is not.
 * Calling it again is "Send OTP again" — the new code replaces the old one.
 */
export function forgotPassword(mobileNumber: string): Promise<ForgotPasswordData> {
  return apiRequest<ForgotPasswordData>('/auth/forgot-password', {
    method: 'POST',
    body: { mobileNumber },
    auth: false,
  })
}

/** `POST /api/auth/reset-password` — step 2. No token: the OTP is the proof. */
export function resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordData> {
  return apiRequest<ResetPasswordData>('/auth/reset-password', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

/**
 * `POST /api/auth/change-password` — protected; the account is identified by
 * the bearer token, never by anything in the body.
 */
export function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordData> {
  return apiRequest<ChangePasswordData>('/auth/change-password', {
    method: 'POST',
    body: payload,
    // 401 here means the current password was wrong, not that the token died.
    signOutOn401: false,
  })
}

/**
 * `GET /api/auth/me` — the signed-in owner's full garage profile.
 * Protected: the bearer token is attached by `apiRequest`.
 */
export function getProfile(): Promise<ProfileData> {
  return apiRequest<ProfileData>('/auth/me')
}

export const authService = {
  login,
  generateOtp,
  verifyOtp,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
  getProfile,
}
