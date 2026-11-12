import emailjs from '@emailjs/browser'
import { event } from '../config/event.config.js'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const emailReady = Boolean(serviceId && templateId && publicKey)

/**
 * Sends the access code to a newly confirmed guest.
 * The EmailJS template must use: to_email, to_name, code, event_name, event_date.
 */
export async function sendAccessCode({ email, firstName, code }) {
  if (!emailReady) throw new Error('EmailJS is not configured')
  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: email,
      to_name: firstName,
      code,
      event_name: event.name,
      event_date: `${event.dateText}, ${event.timeText}`,
    },
    { publicKey },
  )
}
