/**
 * How a visitor reaches the GaragePilot team — one place, so the header, the
 * footer, the Contact page and every call to action show the same details.
 */
export const CONTACT_EMAIL = 'logikshubsolution@gmail.com'

/** Ten-digit Indian mobile number, as it is dialled locally. */
export const CONTACT_PHONE = '9723657967'

/** `97236 57967` — split the way the number is read aloud. */
export const CONTACT_PHONE_DISPLAY = `+91 ${CONTACT_PHONE.slice(0, 5)} ${CONTACT_PHONE.slice(5)}`

export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`
export const CONTACT_PHONE_HREF = `tel:+91${CONTACT_PHONE}`
export const CONTACT_WHATSAPP_HREF = `https://wa.me/91${CONTACT_PHONE}?text=${encodeURIComponent(
  'Hi, I would like to know more about GaragePilot for my garage.',
)}`
