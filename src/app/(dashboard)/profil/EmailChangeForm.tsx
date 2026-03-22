'use client'

import { useState } from 'react'
import { changeMyEmail } from './actions'
import styles from './profil.module.css'
import { useRouter } from 'next/navigation'

export default function EmailChangeForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      const result = await changeMyEmail(currentPassword, newEmail)
      if (result.error) {
        setAlert({ type: 'error', message: result.error })
      } else {
        setAlert({ type: 'success', message: 'Email modifié avec succès !' })
        setCurrentPassword('')
        setNewEmail('')
        router.refresh() // Refresh profile data to show new email
      }
    } catch {
      setAlert({ type: 'error', message: 'Erreur inattendue. Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.passwordForm}>
      {alert && (
        <div className={`${styles.alert} ${alert.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {alert.message}
        </div>
      )}

      <div className="form-group">
        <label>Email Actuel</label>
        <input type="text" className="form-control" value={currentEmail} disabled style={{ background: 'var(--background-secondary)', cursor: 'not-allowed' }} />
      </div>

      <div className="form-group">
        <label htmlFor="newEmail">Nouvel Email</label>
        <input
          type="email"
          id="newEmail"
          className="form-control"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="currentPasswordEmail">Mot de passe pour confirmer</label>
        <input
          type="password"
          id="currentPasswordEmail"
          className="form-control"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Modification en cours...' : 'Changer l\'email'}
      </button>
    </form>
  )
}
