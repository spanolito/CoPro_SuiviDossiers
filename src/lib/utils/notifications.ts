import { sendEmail } from '@/lib/services/email'

/**
 * Notifies the admin when a new user requests access.
 */
export async function notifyAdminNewUser(user: { nomAffiche: string; email: string }) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[NOTIFICATIONS] ADMIN_EMAIL non configuré dans .env')
    return
  }

  try {
    await sendEmail({
      to: adminEmail,
      subject: 'Nouvelle demande d\'accès - Copropriété - L\'Ambassadeur',
      template: 'user-access-request',
      data: {
        name: user.nomAffiche,
        email: user.email,
        date: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Zurich' })
      }
    })
  } catch (error) {
    // Log error but do not block main flow
    console.error('[NOTIFICATIONS] Failed to notify admin for new user:', error)
  }
}

/**
 * Notifies the user and admin about a role or status change.
 */
export async function notifyUserRoleChange(
  user: { nomAffiche: string; email: string | null },
  changes: { role?: { old: string; new: string }; status?: { old: string; new: string } }
) {
  const adminEmail = process.env.ADMIN_EMAIL
  const hasChanges = changes.role || changes.status

  if (!hasChanges) return

  let oldValue = ''
  let newValue = ''

  if (changes.role) {
    oldValue += `Rôle: ${changes.role.old}`
    newValue += `Rôle: ${changes.role.new}`
  }
  if (changes.status) {
    if (oldValue) {
      oldValue += ' | '
      newValue += ' | '
    }
    oldValue += `Statut: ${changes.status.old}`
    newValue += `Statut: ${changes.status.new}`
  }

  const recipients: string[] = []
  if (user.email) recipients.push(user.email)
  if (adminEmail) recipients.push(adminEmail)

  if (recipients.length === 0) return

  try {
    await sendEmail({
      to: recipients,
      subject: 'Mise à jour de votre compte - Copropriété - L\'Ambassadeur',
      template: 'user-status-changed',
      data: {
        name: user.nomAffiche,
        email: user.email || '-',
        oldValue: oldValue,
        newValue: newValue,
        date: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Zurich' })
      }
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to notify user role change:', error)
  }
}

/**
 * Notifies the admin when a dossier becomes critical.
 */
export async function notifyAdminCriticalDossier(dossier: { titre: string; reference: string }) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  try {
    await sendEmail({
      to: adminEmail,
      subject: `ALERTE : Dossier CRITIQUE - ${dossier.reference}`,
      body: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #ef4444;">Alerte : Dossier Critique</h2>
          <p>Le dossier suivant est passé en priorité critique :</p>
          <ul>
            <li><strong>Référence :</strong> ${dossier.reference}</li>
            <li><strong>Titre :</strong> ${dossier.titre}</li>
          </ul>
          <p><a href="${process.env.NEXT_URL || 'http://localhost:3001'}/dossiers/${dossier.reference}" style="color: #2563eb;">Voir le dossier</a></p>
        </div>
      `
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to notify admin for critical dossier:', error)
  }
}
