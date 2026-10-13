/**
 * Runtime configuration read from Vite env variables.
 * Override in `.env` / `.env.local` (see `.env.example`).
 */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, ''),

  /**
   * Path the public Contact form posts an enquiry to, relative to
   * `apiBaseUrl` (e.g. `/contact`). The API does not expose this endpoint yet,
   * so it is **empty by default** and the form says so instead of pretending a
   * message was delivered. Set `VITE_CONTACT_ENQUIRY_PATH` once the endpoint
   * exists and the form starts sending.
   */
  contactEnquiryPath: (import.meta.env.VITE_CONTACT_ENQUIRY_PATH ?? '').trim(),
}

/** True once the Contact form has somewhere to send an enquiry. */
export const contactEnquiryEnabled = env.contactEnquiryPath.length > 0
