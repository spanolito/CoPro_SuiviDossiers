'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

async function getAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  
  const payload = await verifyToken(token)
  if (payload?.role !== 'Admin') {
    throw new Error('Action non autorisée - Administrateur requis')
  }
  return payload
}

export async function archiveDossier(id: string, archive: boolean) {
  const admin = await getAdminUser()
  
  await prisma.dossier.update({
    where: { id },
    data: {
      archived: archive,
      archivedAt: archive ? new Date() : null,
      archivedById: archive ? (admin.id as string) : null
    }
  })

  await prisma.activityLog.create({
    data: {
      action: archive ? 'ARCHIVED_DOSSIER' : 'UNARCHIVED_DOSSIER',
      targetType: 'Dossier',
      targetId: id,
      userId: admin.id as string
    }
  })

  // Create a real notification
  const dossier = await prisma.dossier.findUnique({ where: { id }, select: { assigneeId: true, title: true }})
  if (dossier?.assigneeId && dossier.assigneeId !== admin.id) {
    await prisma.notification.create({
      data: {
        title: archive ? 'Dossier archivé' : 'Dossier désarchivé',
        message: `Le dossier "${dossier.title}" a été ${archive ? 'archivé' : 'désarchivé'} par l'administrateur.`,
        userId: dossier.assigneeId
      }
    })
  }

  revalidatePath(`/dossiers/${id}`)
  revalidatePath('/dossiers')
}

export async function deleteDossiers(id: string) {
  const admin = await getAdminUser()
  
  await prisma.dossier.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      action: 'DELETED_DOSSIER_HARD',
      targetType: 'System_Audit',
      targetId: id,
      userId: admin.id as string
    }
  })

  redirect('/dossiers')
}

export async function updateDossierStatus(id: string, newStatus: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  const payload = await verifyToken(token)

  if (payload?.role === 'Read-only') {
    throw new Error('Action non autorisée')
  }

  // Business Rule: only admin can CLOTURE
  if (newStatus === 'CLOTURE' && payload?.role !== 'Admin') {
    throw new Error('Seul un administrateur peut clôturer ce dossier.')
  }

  await prisma.dossier.update({
    where: { id },
    data: { statut: newStatus }
  })

  await prisma.activityLog.create({
    data: {
      action: `STATUS_UPDATED_${newStatus}`,
      targetType: 'Dossier',
      targetId: id,
      userId: payload?.id as string
    }
  })

  revalidatePath(`/dossiers/${id}`)
}

export async function finalizeDossier(id: string, decision: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  const payload = await verifyToken(token)

  if (payload?.role === 'Read-only') throw new Error('Non autorisé')

  await prisma.dossier.update({
    where: { id },
    data: {
      statut: 'A_VALIDER',
      finalDecision: decision,
      finalizedAt: new Date(),
      finalizedById: payload?.id as string
    }
  })

  await prisma.activityLog.create({
    data: {
      action: 'DOSSIER_FINALIZED',
      targetType: 'Dossier',
      targetId: id,
      userId: payload?.id as string
    }
  })

  revalidatePath(`/dossiers/${id}`)
}

export async function closeDossier(id: string) {
  const admin = await getAdminUser() // Enforces Admin role

  await prisma.dossier.update({
    where: { id },
    data: {
      statut: 'CLOTURE',
      closedAt: new Date(),
      closedById: admin.id as string
    }
  })

  await prisma.activityLog.create({
    data: {
      action: 'DOSSIER_CLOSED',
      targetType: 'Dossier',
      targetId: id,
      userId: admin.id as string
    }
  })

  revalidatePath(`/dossiers/${id}`)
}
