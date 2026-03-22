'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAdminUser() {
  return await prisma.user.findFirst({ where: { role: { name: 'Admin' } } })
}

export async function archiveDossier(id: string, archive: boolean) {
  const admin = await getAdminUser() // Standard demo fallback
  
  await prisma.dossier.update({
    where: { id },
    data: {
      archived: archive,
      archivedAt: archive ? new Date() : null,
      archivedById: archive ? admin?.id : null
    }
  })

  await prisma.activityLog.create({
    data: {
      action: archive ? 'ARCHIVED_DOSSIER' : 'UNARCHIVED_DOSSIER',
      targetType: 'Dossier',
      targetId: id,
      userId: admin?.id
    }
  })

  revalidatePath(`/dossiers/${id}`)
  revalidatePath('/dossiers')
}

export async function deleteDossiers(id: string) {
  const admin = await getAdminUser()
  
  // Actually we rely on onDelete: Cascade define in Prisma
  await prisma.dossier.delete({ where: { id } })

  // Log won't attach to Deleted Dossier easily as log targets it but ok for general audit?
  // targetId will be deleted dossier id which is fine
  await prisma.activityLog.create({
    data: {
      action: 'DELETED_DOSSIER_HARD',
      targetType: 'Dossier',
      targetId: id,
      userId: admin?.id
    }
  })

  redirect('/dossiers')
}
