'use server'

import prisma from '@/lib/prisma'
import { notifyAll } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

export async function createImportsBulk(dossiers: any[]) {
  const admin = await prisma.utilisateur.findFirst({ where: { role: 'PRESIDENT_CS' } })
  const copro = await prisma.copropriete.findFirst()

  if (!admin || !copro) throw new Error('Configuration manquante')

  const count = await prisma.dossier.count()
  let currentCount = count + 1
  const year = new Date().getFullYear()

  for (const d of dossiers) {
    const ref = `DOS-${year}-${String(currentCount).padStart(4, '0')}`
    currentCount++

    const newDoc = await prisma.dossier.create({
      data: {
        coproprieteId: copro.id,
        reference: ref,
        titre: d.title || d.titre,
        description: d.description || '',
        typeDossier: d.typeDossier || 'AUTRE',
        statut: d.statut || 'ENREGISTRE',
        priorite: d.priorite || 'MOYENNE',
        responsableCSId: admin.id,
        createurUserId: admin.id,
      }
    })

    await prisma.dossierActivite.create({
      data: {
        dossierId: newDoc.id,
        userId: admin.id,
        typeAction: 'DOSSIER_CREE',
        resume: 'Dossier importé depuis texte',
      }
    })

    await prisma.dossierEtape.create({
      data: {
        dossierId: newDoc.id,
        titre: 'Import depuis compte rendu',
        typeEtape: 'CREATION',
        statutEtape: 'TERMINEE',
        auteurUserId: admin.id,
        dateRealisation: new Date(),
      }
    })
  }

  // Notify users
  await notifyAll(
    'Importation de dossiers',
    `${dossiers.length} dossiers ont été importés avec succès.`,
    'DOSSIER_CREE' as any
  )

  revalidatePath('/dossiers')
}
