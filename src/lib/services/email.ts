import { Resend } from 'resend'

export interface EmailPayload {
  to: string | string[]
  subject: string
  template?: string
  data?: any
  body?: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

function buildHtml({ body, template, data }: Pick<EmailPayload, 'body' | 'template' | 'data'>) {
  if (body) return body

  if (template === 'user-access-request') {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Nouvelle demande d'accès</h2>
        <p>Un nouvel utilisateur a demandé un accès au site.</p>
        <ul>
          <li><strong>Nom :</strong> ${data?.name ?? '-'}</li>
          <li><strong>Email :</strong> ${data?.email ?? '-'}</li>
          <li><strong>Date :</strong> ${data?.date ?? '-'}</li>
        </ul>
      </div>
    `
  }

  if (template === 'user-status-changed') {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Changement de statut utilisateur</h2>
        <p>Le statut ou le rôle d'un utilisateur a été modifié.</p>
        <ul>
          <li><strong>Nom :</strong> ${data?.name ?? '-'}</li>
          <li><strong>Email :</strong> ${data?.email ?? '-'}</li>
          <li><strong>Ancienne valeur :</strong> ${data?.oldValue ?? '-'}</li>
          <li><strong>Nouvelle valeur :</strong> ${data?.newValue ?? '-'}</li>
          <li><strong>Date :</strong> ${data?.date ?? '-'}</li>
        </ul>
      </div>
    `
  }

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>${body ?? 'Notification Conseil Syndical - L\'Ambassadeur'}</p>
    </div>
  `
}

export async function sendEmail({ to, subject, body, template, data }: EmailPayload) {
  const recipients = Array.isArray(to) ? to : [to]
  const from = process.env.SMTP_FROM || 'Conseil Syndical - L\'Ambassadeur <[EMAIL_ADDRESS]>'

  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL SERVICE] RESEND_API_KEY non configurée.')
    console.log('================ [EMAIL OUTBOUND MOCK] ================')
    console.log('To:', recipients.join(', '))
    console.log('Subject:', subject)
    console.log('From:', from)
    console.log('Content:\n', body || JSON.stringify(data, null, 2))
    console.log('======================================================')
    return { id: 'mock-id' }
  }

  const html = buildHtml({ body, template, data })

  console.log('[EMAIL SERVICE] Intent and destinations:', {
    from,
    to: recipients,
    subject
  })

  try {
    const { data: result, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    })

    if (error) {
      console.error('[EMAIL SERVICE] Resend error response received:', error)
      throw new Error(error.message)
    }

    console.log('[EMAIL SERVICE] Resend success response:', result)
    return result
  } catch (error) {
    console.error('[EMAIL SERVICE] Failed to send email:', error)
    throw error
  }
}