import { apiRequest } from './httpClient'
import { contactEnquiryEnabled, env } from '@/config/env'

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

/**
 * The single integration point for the public Contact form.
 *
 * The Node.js API carries **no enquiry endpoint today**, so the path is read
 * from `VITE_CONTACT_ENQUIRY_PATH` and is blank by default. The form checks
 * `contactEnquiryEnabled` before it offers to send anything, which is what
 * keeps it from claiming a message was delivered when there is nowhere to
 * deliver it. Once the endpoint ships, set the variable — nothing else here
 * needs to change, and the usual `ApiError` handling already applies.
 */
export function submitContactEnquiry(
  payload: ContactEnquiryPayload,
): Promise<ContactEnquiryData> {
  if (!contactEnquiryEnabled) {
    return Promise.reject(
      new Error('No contact endpoint is configured (VITE_CONTACT_ENQUIRY_PATH).'),
    )
  }

  return apiRequest<ContactEnquiryData>(env.contactEnquiryPath, {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export const contactService = { submitContactEnquiry }
