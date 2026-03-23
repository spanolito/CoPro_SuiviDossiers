import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  return (
    <div style={{ paddingBottom: 40 }}>
      <SettingsClient user={payload} />
    </div>
  )
}
