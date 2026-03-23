import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getPrestataires } from './actions'
import { hasPermission } from '@/lib/auth/rbac'
import PrestatairesClient from './PrestatairesClient'

export default async function PrestatairesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) return null

  // Autorisé en modification si Conseil Syndical ou Admin (permission dossier.create)
  const canEdit = hasPermission(payload.role as string, 'dossier.create')

  const initialData = await getPrestataires()

  return (
    <div style={{ paddingBottom: 40 }}>
      <PrestatairesClient initialData={initialData as any} canEdit={canEdit} />
    </div>
  )
}
