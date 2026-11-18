import { apiRequest } from './httpClient'
import { env } from '@/config/env'
import { CONTACT_EMAIL } from '@/lib/publicContact'

/** What the public Contact form collects. */
export interface ContactEnquiryPayload {
  name: string
  mobileNumber: string
  /** Optional, exactly as on the registration form. */
  email?: string
  garageName?: string
  subject: string
  message: string
}

export interface ContactEnquiryData {
  id?: string
}

/** FormSubmit's AJAX endpoint — emails the posted fields to `CONTACT_EMAIL`. */
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`

/**
 * Emails an enquiry to the GaragePilot inbox via FormSubmit (no backend or
 * key needed). The very first submission makes FormSubmit send an activation
 * email to `CONTACT_EMAIL`; enquiries are delivered once that link is clicked.
 */
async function emailEnquiry(payload: ContactEnquiryPayload): Promise<ContactEnquiryData> {
  const response = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `GaragePilot enquiry: ${payload.subject} — ${payload.name}`,
      _template: 'table',
      _captcha: 'false',
      ...(payload.email ? { _replyto: payload.email } : {}),
      Name: payload.name,
      'Mobile Number': payload.mobileNumber,
      Email: payload.email ?? '—',
      'Garage Name': payload.garageName ?? '—',
      Subject: payload.subject,
      Message: payload.message,
    }),
  })

  const data = (await response.json().catch(() => ({}))) as {
    success?: string | boolean
    message?: string
  }
  if (!response.ok || String(data.success) !== 'true') {
    throw new Error(
      data.message || 'We could not send your message. Please call or WhatsApp us instead.',
    )
  }
  return {}
}

/**
 * The single integration point for the public Contact form.
 *
 * When `VITE_CONTACT_ENQUIRY_PATH` is set the enquiry goes to the Node.js API;
 * otherwise (the default today) it is emailed to `CONTACT_EMAIL`.
 */
export function submitContactEnquiry(
  payload: ContactEnquiryPayload,
): Promise<ContactEnquiryData> {
  if (!env.contactEnquiryPath) return emailEnquiry(payload)

  return apiRequest<ContactEnquiryData>(env.contactEnquiryPath, {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export const contactService = { submitContactEnquiry }
