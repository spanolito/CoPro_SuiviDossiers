import { getMyProfile } from './actions'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import styles from './profil.module.css'
import PasswordChangeForm from './PasswordChangeForm'
import EmailChangeForm from './EmailChangeForm'

const ROLE_LABELS: Record<string, string> = {
  PRESIDENT_CS: 'Président du Conseil Syndical',
  MEMBRE_CS: 'Membre du Conseil Syndical',
  COPROPRIETAIRE_LECTURE: 'Copropriétaire (lecture seule)',
}

export default async function ProfilPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) redirect('/login')

  const payload = await verifyToken(token)
  if (!payload) redirect('/login')

  const user = await getMyProfile()
  if (!user) redirect('/login')

  const initials = user.nomAffiche.substring(0, 2).toUpperCase()

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Mon Profil</h1>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>{initials}</div>
          <div>
            <div className={styles.profileName}>{user.nomAffiche}</div>
            <div className={styles.profileRole}>{ROLE_LABELS[user.role] || user.role}</div>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Rôle</span>
            <span className={styles.infoValue}>{ROLE_LABELS[user.role] || user.role}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Membre depuis</span>
            <span className={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          {user.lastLoginAt && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Dernière connexion</span>
              <span className={styles.infoValue}>{new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.profileCard}>
        <h2 className={styles.sectionTitle}>🔒 Changer mon mot de passe</h2>
        <PasswordChangeForm />
      </div>

      <div className={styles.profileCard}>
        <h2 className={styles.sectionTitle}>📧 Changer mon adresse email</h2>
        <EmailChangeForm currentEmail={user.email} />
      </div>
    </div>
  )
}
