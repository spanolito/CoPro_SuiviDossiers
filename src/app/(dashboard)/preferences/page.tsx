import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import SettingsClient from './SettingsClient'
import prisma from '@/lib/prisma'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) return null

  const dbUser = await prisma.utilisateur.findUnique({
    where: { id: payload.id as string }
  })

  const copro = await prisma.copropriete.findFirst()

  return (
    <div style={{ paddingBottom: 40 }}>
      <SettingsClient user={{ ...payload, ...(dbUser || {}) }} copro={copro} />
    </div>
  )
}
