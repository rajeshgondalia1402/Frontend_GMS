/** Types mirroring the Node.js API contract for `/api/admin`. */

/**
 * The platform admin behind `POST /api/admin/login`.
 * `id` is a **number** here (the `AdminLogin` table), not the UUID a garage
 * owner gets — which is the clearest signal that this is a different account
 * type on a different token.
 */
export interface AdminUser {
  id: number
  name: string
  mobileNumber: string
}

export interface AdminLoginPayload {
  mobileNumber: string
  password: string
}

/** `POST /api/admin/login` — the same envelope as the garage login. */
export interface AdminLoginData {
  token: string
  /** Human readable token lifetime returned by the API, e.g. `"30d"`. */
  expiresIn: string
  /** ISO timestamp at which the token stops being valid. */
  expiresAt: string
  admin: AdminUser
}

/** What we persist locally so a refresh keeps the admin signed in. */
export interface AdminSession {
  token: string
  expiresIn: string
  expiresAt: string
  admin: AdminUser
}

/** `POST /api/admin/change-password` — the admin id comes from the token. */
export interface AdminChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface AdminChangePasswordData {
  id: number
  mobileNumber: string
  passwordChangedAt: string
}
