/**
 * Runtime configuration read from Vite env variables.
 * Override in `.env` / `.env.local` (see `.env.example`).
 */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, ''),

  /**
   * Optional path the public Contact form posts an enquiry to, relative to
   * `apiBaseUrl` (e.g. `/contact`). The API does not expose this endpoint yet,
   * so it is **empty by default** and enquiries are emailed straight to
   * `CONTACT_EMAIL` through FormSubmit instead. Set `VITE_CONTACT_ENQUIRY_PATH`
   * once the API endpoint exists to route enquiries through it.
   */
  contactEnquiryPath: (import.meta.env.VITE_CONTACT_ENQUIRY_PATH ?? '').trim(),
}

/** The Contact form always has somewhere to send: the API or the inbox. */
export const contactEnquiryEnabled = true
