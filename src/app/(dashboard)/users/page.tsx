import prisma from '@/lib/prisma'
import styles from './users.module.css'
import { Plus, UserCog } from 'lucide-react'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' }
  })

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Gestion des Utilisateurs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez les accès et les rôles de la copropriété.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Ajouter un utilisateur
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Date de création</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
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
                  <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    {user.role.name}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }}>
                    <UserCog size={14} /> Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
