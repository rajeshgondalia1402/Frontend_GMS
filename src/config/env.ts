/**
 * Runtime configuration read from Vite env variables.
 * Override in `.env` / `.env.local` (see `.env.example`).
 */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, ''),
}
