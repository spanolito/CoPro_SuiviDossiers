'use client'

import { useState } from 'react'
import { updateUserStatus, updateUserRole } from './actions'
import styles from './users.module.css'

type Role = { id: string; name: string }
type User = { id: string; name: string; email: string; status: string; createdAt: Date; roleId: string; role: Role }

export default function UsersClient({ users, roles, currentAdminId }: { users: User[], roles: Role[], currentAdminId: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setLoadingId(userId)
    setError(null)
    const res = await updateUserStatus(userId, newStatus)
    if (res?.error) setError(res.error)
    setLoadingId(null)
  }

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setLoadingId(userId)
    setError(null)
    const res = await updateUserRole(userId, newRoleId)
    if (res?.error) setError(res.error)
    setLoadingId(null)
  }

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  return (
    <>
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Statut</th>
              <th>Rôle</th>
              <th>Date de création</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ opacity: loadingId === user.id ? 0.5 : 1 }}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{getInitials(user.name)}</div>
                    <div>
                      <div className={styles.nameCol}>{user.name}</div>
                      <div className={styles.emailCol}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <select 
                    value={user.status} 
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    disabled={user.id === currentAdminId || loadingId === user.id}
                    className="form-control"
                    style={{ padding: '4px 8px', fontSize: 13, minWidth: 120 }}
                  >
                    <option value="PENDING">En attente</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="DISABLED">Désactivé</option>
                  </select>
                </td>
                <td>
                  <select 
                    value={user.roleId} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === currentAdminId || loadingId === user.id}
                    className="form-control"
                    style={{ padding: '4px 8px', fontSize: 13, minWidth: 140 }}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
