'use client'

import { FormEvent, MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserDetails } from './actions'
import styles from './users.module.css'

type Role = { id: string; name: string }
type User = { id: string; name: string; email: string; status: string; createdAt: Date; roleId: string; role: Role }
type Alert = { message: string; tone: 'success' | 'error' }

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'DISABLED', label: 'Désactivé' }
] as const

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Président du Conseil Syndical',
  'Conseil syndical': 'Membre du Conseil Syndical',
  'Read-only': 'Copropriétaire'
}

const formatRoleName = (roleName: string) => ROLE_LABELS[roleName] ?? roleName

export default function UsersClient({ users, roles, currentAdminId }: { users: User[]; roles: Role[]; currentAdminId: string }) {
  const router = useRouter()
  const defaultRoleId = roles[0]?.id ?? ''
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    roleId: defaultRoleId,
    status: 'ACTIVE'
  })

  useEffect(() => {
    if (!selectedUser) {
      setFormValues({
        name: '',
        email: '',
        roleId: defaultRoleId,
        status: 'ACTIVE'
      })
      setModalError(null)
      return
    }

    setFormValues({
      name: selectedUser.name,
      email: selectedUser.email,
      roleId: selectedUser.roleId,
      status: selectedUser.status
    })
    setModalError(null)
  }, [selectedUser, defaultRoleId])

  useEffect(() => {
    if (!selectedUser) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedUser(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedUser])

  const handleStatusChange = async (user: User, newStatus: string) => {
    setLoadingId(user.id)
    setAlert(null)
    try {
      const result = await updateUserDetails({
        userId: user.id,
        status: newStatus
      })
      if (result?.error) {
        setAlert({ tone: 'error', message: result.error })
        return
      }
      setAlert({ tone: 'success', message: `Statut de ${user.name} mis à jour.` })
      router.refresh()
    } catch (error) {
      console.error(error)
      setAlert({ tone: 'error', message: 'Impossible de mettre à jour le statut.' })
    } finally {
      setLoadingId(null)
    }
  }

  const handleRoleChange = async (user: User, newRoleId: string) => {
    setLoadingId(user.id)
    setAlert(null)
    try {
      const result = await updateUserDetails({
        userId: user.id,
        roleId: newRoleId
      })
      if (result?.error) {
        setAlert({ tone: 'error', message: result.error })
        return
      }
      setAlert({ tone: 'success', message: `Rôle de ${user.name} mis à jour.` })
      router.refresh()
    } catch (error) {
      console.error(error)
      setAlert({ tone: 'error', message: 'Impossible de mettre à jour le rôle.' })
    } finally {
      setLoadingId(null)
    }
  }

  const openEditModal = (user: User) => {
    setAlert(null)
    setSelectedUser(user)
  }

  const handleModalClose = () => {
    setModalError(null)
    setSelectedUser(null)
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      handleModalClose()
    }
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedUser) return
    setIsSubmitting(true)
    setModalError(null)

    try {
      const result = await updateUserDetails({
        userId: selectedUser.id,
        name: formValues.name,
        email: formValues.email,
        roleId: formValues.roleId,
        status: formValues.status
      })

      if (result?.error) {
        setModalError(result.error)
        return
      }

      setAlert({ tone: 'success', message: 'Utilisateur mis à jour avec succès.' })
      setSelectedUser(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      setModalError("Impossible d'enregistrer les modifications.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {alert && (
        <div
          className={`${styles.alert} ${alert.tone === 'error' ? styles.alertError : styles.alertSuccess}`}
          role="status"
          aria-live="polite"
        >
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
                    <div className={styles.avatar}>{user.name.substring(0, 2).toUpperCase()}</div>
                    <div>
                      <div className={styles.nameCol}>{user.name}</div>
                      <div className={styles.emailCol}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    value={user.status}
                    onChange={(event) => handleStatusChange(user, event.target.value)}
                    disabled={user.id === currentAdminId || loadingId === user.id}
                    className="form-control"
                    style={{ padding: '4px 8px', fontSize: 13, minWidth: 120 }}
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={user.roleId}
                    onChange={(event) => handleRoleChange(user, event.target.value)}
                    disabled={user.id === currentAdminId || loadingId === user.id}
                    className="form-control"
                    style={{ padding: '4px 8px', fontSize: 13, minWidth: 140 }}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {formatRoleName(role.name)}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className={styles.actionButton}
                    disabled={loadingId === user.id}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-user-${selectedUser.id}-title`}
          >
            <div className={styles.modalHeader}>
              <h3 id={`edit-user-${selectedUser.id}-title`}>Modifier {selectedUser.name}</h3>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={handleModalClose}
                aria-label="Fermer la fenêtre"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className={styles.modalBody}>
                {modalError && (
                  <p className={styles.modalError} role="alert">
                    {modalError}
                  </p>
                )}

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`name-${selectedUser.id}`}>
                    Nom
                  </label>
                  <input
                    id={`name-${selectedUser.id}`}
                    name="name"
                    value={formValues.name}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`email-${selectedUser.id}`}>
                    Email
                  </label>
                  <input
                    id={`email-${selectedUser.id}`}
                    name="email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`role-${selectedUser.id}`}>
                    Rôle
                  </label>
                  <select
                    id={`role-${selectedUser.id}`}
                    name="role"
                    value={formValues.roleId}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, roleId: event.target.value }))}
                    className={styles.formSelect}
                    disabled={selectedUser.id === currentAdminId || roles.length === 0}
                  >
                    {roles.length === 0 ? (
                      <option value="">Rôle indisponible</option>
                    ) : (
                      roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {formatRoleName(role.name)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`status-${selectedUser.id}`}>
                    Statut
                  </label>
                  <select
                    id={`status-${selectedUser.id}`}
                    name="status"
                    value={formValues.status}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, status: event.target.value }))}
                    className={styles.formSelect}
                    disabled={selectedUser.id === currentAdminId}
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={handleModalClose}>
                  Annuler
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
