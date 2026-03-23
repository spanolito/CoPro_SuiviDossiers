'use client'

import { FormEvent, MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserDetails, deleteUser, adminResetPassword } from './actions'
import styles from './users.module.css'

type User = { id: string; nomAffiche: string; email: string; status: string; role: string; createdAt: Date }
type Alert = { message: string; tone: 'success' | 'error' }

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'DISABLED', label: 'Désactivé' }
] as const

const ROLE_OPTIONS = [
  { value: 'PRESIDENT_CS', label: 'Président du Conseil Syndical' },
  { value: 'MEMBRE_CS', label: 'Membre du Conseil Syndical' },
  { value: 'COPROPRIETAIRE_LECTURE', label: 'Copropriétaire (lecture seule)' },
] as const

const formatRoleName = (role: string) => {
  const r = ROLE_OPTIONS.find(o => o.value === role)
  return r?.label ?? role
}

export default function UsersClient({ users, currentAdminId, currentUserRole }: { users: User[]; currentAdminId: string; currentUserRole: string }) {
  const router = useRouter()
  const isReadOnly = currentUserRole === 'cs'
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState({ name: '', email: '', role: 'COPROPRIETAIRE_LECTURE', status: 'ACTIVE' })
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.nomAffiche} ?`)) return
    setLoadingId(user.id)
    setAlert(null)
    try {
      const result = await deleteUser(user.id)
      if (result?.error) { setAlert({ tone: 'error', message: result.error }); return }
      setAlert({ tone: 'success', message: `Utilisateur ${user.nomAffiche} supprimé.` })
      router.refresh()
    } catch { setAlert({ tone: 'error', message: 'Impossible de supprimer l\'utilisateur.' }) }
    finally { setLoadingId(null) }
  }

  useEffect(() => {
    if (!selectedUser) {
      setFormValues({ name: '', email: '', role: 'COPROPRIETAIRE_LECTURE', status: 'ACTIVE' })
      setModalError(null)
      return
    }
    setFormValues({ name: selectedUser.nomAffiche, email: selectedUser.email, role: selectedUser.role, status: selectedUser.status })
    setModalError(null)
  }, [selectedUser])

  useEffect(() => {
    if (!selectedUser) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedUser(null) }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedUser])

  const handleStatusChange = async (user: User, newStatus: string) => {
    setLoadingId(user.id)
    setAlert(null)
    try {
      const result = await updateUserDetails({ userId: user.id, status: newStatus })
      if (result?.error) { setAlert({ tone: 'error', message: result.error }); return }
      setAlert({ tone: 'success', message: `Statut de ${user.nomAffiche} mis à jour.` })
      router.refresh()
    } catch { setAlert({ tone: 'error', message: 'Impossible de mettre à jour le statut.' }) }
    finally { setLoadingId(null) }
  }

  const handleRoleChange = async (user: User, newRole: string) => {
    setLoadingId(user.id)
    setAlert(null)
    try {
      const result = await updateUserDetails({ userId: user.id, role: newRole })
      if (result?.error) { setAlert({ tone: 'error', message: result.error }); return }
      setAlert({ tone: 'success', message: `Rôle de ${user.nomAffiche} mis à jour.` })
      router.refresh()
    } catch { setAlert({ tone: 'error', message: 'Impossible de mettre à jour le rôle.' }) }
    finally { setLoadingId(null) }
  }

  const openEditModal = (user: User) => { setAlert(null); setSelectedUser(user) }
  const handleModalClose = () => { setModalError(null); setSelectedUser(null) }
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) handleModalClose() }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)
    setModalError(null)
    try {
      const result = await updateUserDetails({
        userId: selectedUser.id,
        name: formValues.name,
        role: formValues.role,
        status: formValues.status
      })
      if (result?.error) { setModalError(result.error); return }
      setAlert({ tone: 'success', message: 'Utilisateur mis à jour avec succès.' })
      setSelectedUser(null)
      router.refresh()
    } catch { setModalError("Impossible d'enregistrer les modifications.") }
    finally { setIsSubmitting(false) }
  }

  return (
    <>
      {alert && (
        <div className={`${styles.alert} ${alert.tone === 'error' ? styles.alertError : styles.alertSuccess}`} role="status" aria-live="polite">
          {alert.message}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Statut</th>
              <th>Rôle</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ opacity: loadingId === user.id ? 0.5 : 1 }}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{user.nomAffiche.substring(0, 2).toUpperCase()}</div>
                    <div>
                      <div className={styles.nameCol}>{user.nomAffiche}</div>
                      <div className={styles.emailCol}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td data-label="Statut">
                  <select
                    value={user.status}
                    onChange={(event) => handleStatusChange(user, event.target.value)}
                    disabled={user.id === currentAdminId || loadingId === user.id || isReadOnly}
                    className="form-control"
                    style={{ padding: '4px 8px', fontSize: 13, minWidth: 120 }}
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Rôle">
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user, event.target.value)}
                    disabled={user.id === currentAdminId || loadingId === user.id || isReadOnly}
                    className="form-control"
                    style={{ padding: '4px 8px', fontSize: 13, minWidth: 140 }}
                  >
                    {ROLE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Création" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td data-label="Actions" className={styles.actionsCell}>
                  <div className={styles.actionsWrapper}>
                    {!isReadOnly && (
                      <button type="button" onClick={() => openEditModal(user)} className={styles.actionButton} disabled={loadingId === user.id}>
                        Modifier
                      </button>
                    )}
                    {!isReadOnly && user.id !== currentAdminId && (
                      <button type="button" onClick={() => { setResetTarget(user); setResetPassword(''); setResetError(null) }} className={styles.actionButton} style={{ fontSize: 12, color: 'var(--warning)' }} disabled={loadingId === user.id}>
                        Réinit. MDP
                      </button>
                    )}
                    {!isReadOnly && user.id !== currentAdminId && (
                      <button type="button" onClick={() => handleDeleteUser(user)} className={styles.actionButton} style={{ fontSize: 12, color: 'var(--danger)' }} disabled={loadingId === user.id}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={`edit-user-${selectedUser.id}-title`}>
            <div className={styles.modalHeader}>
              <h3 id={`edit-user-${selectedUser.id}-title`}>Modifier {selectedUser.nomAffiche}</h3>
              <button type="button" className={styles.modalCloseButton} onClick={handleModalClose} aria-label="Fermer la fenêtre">×</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className={styles.modalBody}>
                {modalError && <p className={styles.modalError} role="alert">{modalError}</p>}

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`name-${selectedUser.id}`}>Nom affiché</label>
                  <input id={`name-${selectedUser.id}`} name="name" value={formValues.name} onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))} className={styles.formInput} />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email (Non modifiable)</label>
                  <input value={formValues.email} className={styles.formInput} disabled style={{ background: 'var(--background-secondary)', cursor: 'not-allowed' }} />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`role-${selectedUser.id}`}>Rôle</label>
                  <select
                    id={`role-${selectedUser.id}`}
                    name="role"
                    value={formValues.role}
                    onChange={(e) => setFormValues(prev => ({ ...prev, role: e.target.value }))}
                    className={styles.formSelect}
                    disabled={selectedUser.id === currentAdminId}
                  >
                    {ROLE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`status-${selectedUser.id}`}>Statut</label>
                  <select
                    id={`status-${selectedUser.id}`}
                    name="status"
                    value={formValues.status}
                    onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value }))}
                    className={styles.formSelect}
                    disabled={selectedUser.id === currentAdminId}
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={handleModalClose}>Annuler</button>
                <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.currentTarget === e.target) { setResetTarget(null) } }}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h3>Réinitialiser le mot de passe de {resetTarget.nomAffiche}</h3>
              <button type="button" className={styles.modalCloseButton} onClick={() => setResetTarget(null)} aria-label="Fermer">×</button>
            </div>
            <div className={styles.modalBody}>
              {resetError && <p className={styles.modalError} role="alert">{resetError}</p>}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Définissez un mot de passe temporaire pour cet utilisateur. Il pourra le changer depuis son profil.</p>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="resetPwd">Mot de passe temporaire</label>
                <input id="resetPwd" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className={styles.formInput} minLength={6} placeholder="Minimum 6 caractères" />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setResetTarget(null)}>Annuler</button>
              <button type="button" className={styles.primaryButton} disabled={resetLoading || resetPassword.length < 6} onClick={async () => {
                setResetLoading(true); setResetError(null)
                try {
                  const res = await adminResetPassword(resetTarget.id, resetPassword)
                  if (res.error) { setResetError(res.error) } else { setAlert({ tone: 'success', message: `Mot de passe de ${resetTarget.nomAffiche} réinitialisé.` }); setResetTarget(null) }
                } catch { setResetError('Erreur inattendue.') }
                finally { setResetLoading(false) }
              }}>
                {resetLoading ? 'Réinitialisation...' : 'Réinitialiser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
