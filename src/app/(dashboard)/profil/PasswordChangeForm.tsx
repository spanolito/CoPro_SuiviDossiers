'use client'

import { useState } from 'react'
import { changeMyPassword } from './actions'
import styles from './profil.module.css'

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      const result = await changeMyPassword(currentPassword, newPassword, confirmPassword)
      if (result.error) {
        setAlert({ type: 'error', message: result.error })
      } else {
        setAlert({ type: 'success', message: 'Mot de passe modifié avec succès ! Utilisez-le lors de votre prochaine connexion.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
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
        <label htmlFor="currentPassword">Mot de passe actuel</label>
        <input
          type="password"
          id="currentPassword"
          className="form-control"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="newPassword">Nouveau mot de passe</label>
        <input
          type="password"
          id="newPassword"
          className="form-control"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Minimum 6 caractères</span>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
        <input
          type="password"
          id="confirmPassword"
          className="form-control"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Modification en cours...' : 'Changer le mot de passe'}
      </button>
    </form>
  )
}
