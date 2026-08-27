import { apiRequest } from './httpClient'
import type {
  AdminChangePasswordData,
  AdminChangePasswordPayload,
  AdminLoginData,
  AdminLoginPayload,
} from '@/types/admin'

/**
 * `POST /api/admin/login` — the platform admin, not a garage owner. Returns a
 * token of its own, which every other admin endpoint expects.
 *
 * A wrong number and a wrong password answer the same deliberately vague 401,
 * so the API cannot be used to find out which numbers are admin accounts.
 */
export function login(payload: AdminLoginPayload): Promise<AdminLoginData> {
  return apiRequest<AdminLoginData>('/admin/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

/**
 * `POST /api/admin/change-password` — protected by the **admin** token, which
 * is also where the admin id comes from; it is never part of the body.
 * A garage owner's token answers 403 here.
 */
export function changePassword(
  payload: AdminChangePasswordPayload,
): Promise<AdminChangePasswordData> {
  return apiRequest<AdminChangePasswordData>('/admin/change-password', {
    method: 'POST',
    body: payload,
    authScope: 'admin',
    // 401 here means the current password was wrong, not that the token died.
    signOutOn401: false,
  })
}

export const adminService = {
  login,
  changePassword,
}
