'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createImportsBulk(dossiers: any[]) {
  const admin = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } })
  
  const count = await prisma.dossier.count()
  let currentCount = count + 1;
  const year = new Date().getFullYear()

  for (const d of dossiers) {
    const ref = `DOS-${year}-${String(currentCount).padStart(3, '0')}`
    currentCount++;

    const newDoc = await prisma.dossier.create({
      data: {
        reference: ref,
        title: d.title,
        description: d.description,
        statut: d.statut,
        priorite: d.priorite,
        categoryId: d.categoryId,
        responsableCSId: admin?.id || null, // default assign to admin
        etapes: {
          create: {
            title: 'Import depuis compte rendu',
            statut: 'terminée'
          }
        }
      }
    })
    
    await prisma.activityLog.create({ 
      data: { 
        action: 'IMPORTED_DOSSIER_BULK', 
        targetType: 'Dossier', 
        targetId: newDoc.id,
        userId: admin?.id 
      }
    })
  }
  
  revalidatePath('/dossiers')
}
