export interface EmailPayload {
  to: string | string[]
  subject: string
  template?: string
  data?: any
  body?: string
}

/**
 * Sends an email. 
 * Since SMTP is not configured in .env, this currently LOGS the email to the console.
 * Integrators: Add nodemailer or Mailgun configuration here when ready.
 */
export async function sendEmail({ to, subject, body, template, data }: EmailPayload) {
  const recipients = Array.isArray(to) ? to.join(', ') : to

  console.log(`\n============== [EMAIL OUTBOUND] ==============`)
  console.log(`To:      ${recipients}`)
  console.log(`Subject: ${subject}`)
  if (body) {
    console.log(`Content:\n${body}`)
  }
  if (template && data) {
    console.log(`Template: ${template}`)
    console.log(`Data:`, JSON.stringify(data, null, 2))
  }
  console.log(`==============================================\n`)

  // Return success
  return { success: true, message: 'Email logged for dev mode' }
}
