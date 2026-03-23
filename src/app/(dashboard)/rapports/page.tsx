import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import RapportsClient from './RapportsClient'
import { redirect } from 'next/navigation'

export default async function RapportsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  const rawRole = (payload?.role as string) || 'coproprietaire'
  const isAdmin = rawRole === 'admin' || rawRole === 'PRESIDENT_CS'

  if (!isAdmin) {
     redirect('/dossiers')
  }

  return <RapportsClient />
}
