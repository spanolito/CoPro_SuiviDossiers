import prisma from '@/lib/prisma'
import styles from './users.module.css'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (payload?.role !== 'admin' && payload?.role !== 'cs') {
    redirect('/')
  }

  const users = await prisma.utilisateur.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Gestion des Utilisateurs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez les accès et les rôles de la copropriété.</p>
        </div>
      </div>

      <UsersClient users={users} currentAdminId={payload.id as string} currentUserRole={payload.role as string} />
    </div>
  )
}
