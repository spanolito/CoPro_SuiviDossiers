import nodemailer from 'nodemailer'

export interface EmailPayload {
  to: string | string[]
  subject: string
  template?: string
  data?: any
  body?: string
}

const getTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true'

  if (!host || !user || !pass) {
    // Return a mock transporter that logs to console
    return {
      sendMail: async (options: any) => {
        console.warn('\n⚠️ [EMAIL SERVICE] SMTP non configuré. L\'email ci-dessous n\'a pas pu être envoyé réellement.')
        console.warn('Veuillez ajouter SMTP_HOST, SMTP_USER et SMTP_PASS dans votre fichier .env pour activer les envois réels.\n')
        
        console.log(`============== [EMAIL OUTBOUND (MOCK)] ==============`)
        console.log(`To:      ${options.to}`)
        console.log(`Subject: ${options.subject}`)
        console.log(`Content:\n${options.text || options.html}`)
        console.log(`=====================================================\n`)
        
        return { messageId: 'mock-id' }
      }
    }
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

/**
 * Sends an email using Nodemailer if SMTP is configured.
 */
export async function sendEmail({ to, subject, body, template, data }: EmailPayload) {
  const transporter = getTransporter()
  const recipients = Array.isArray(to) ? to.join(', ') : to
  const from = process.env.SMTP_FROM || 'CoPro Suivi <noreply@votre-domaine.com>'

  try {
    const info = await transporter.sendMail({
      from,
      to: recipients,
      subject,
      text: body,
      // html: template ?? body // placeholder if you use HTML
    })

    console.log(`[EMAIL SERVICE] Email envoyé : ${info.messageId || 'MOCK'}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[EMAIL SERVICE] Erreur lors de l\'envoi du mail:', error)
    return { success: false, error: 'Impossible d\'envoyer le mail' }
  }
}
