import prisma from '@/lib/prisma'
import styles from './users.module.css'
import { Plus } from 'lucide-react'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (payload?.role !== 'Admin') {
    redirect('/')
  }

  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' }
  })

  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Gestion des Utilisateurs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez les accès et les rôles de la copropriété.</p>
        </div>
      </div>

      <UsersClient users={users} roles={roles} currentAdminId={payload.id as string} />
    </div>
  )
}
