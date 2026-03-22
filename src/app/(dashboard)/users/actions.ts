'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null
  if (payload?.role !== 'Admin') {
    throw new Error('Unauthorized')
  }
  return payload
}

export async function updateUserStatus(userId: string, newStatus: string) {
  const admin = await checkAdmin()

  if (userId === admin.id && newStatus === 'DISABLED') {
    return { error: 'Vous ne pouvez pas désactiver votre propre compte administrateur.' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus }
  })
  
  revalidatePath('/users')
  return { success: true }
}

export async function updateUserRole(userId: string, newRoleId: string) {
  const admin = await checkAdmin()

  if (userId === admin.id) {
    return { error: 'Vous ne pouvez pas modifier votre propre rôle.' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: newRoleId }
  })

  revalidatePath('/users')
  return { success: true }
}
