'use server'

import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function getPrestataires() {
  // Tous les utilisateurs authentifiés peuvent lire (copropriétaires inclus)
  await requirePermission('settings.update.self') 

  const copro = await prisma.copropriete.findFirst()
  if (!copro) return []

  return prisma.intervenant.findMany({
    where: { coproprieteId: copro.id, type: 'PRESTATAIRE' },
    orderBy: { nom: 'asc' }
  })
}

export async function createPrestataire(data: any) {
  // Création réservée au conseil syndical / admin
  await requirePermission('dossier.create')

  const copro = await prisma.copropriete.findFirst()
  if (!copro) throw new Error('Copropriété introuvable.')

  if (!data.nom.trim()) throw new Error('Le nom est requis.')

  const created = await prisma.intervenant.create({
    data: {
      coproprieteId: copro.id,
      type: 'PRESTATAIRE',
      nom: data.nom.trim(),
      email: data.email || null,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      contactPrincipal: data.contactPrincipal || null,
      contactRole: data.contactRole || null,
      siteWeb: data.siteWeb || null,
      notes: data.notes || null,
      actif: true
    }
  })

  revalidatePath('/prestataires')
  return { success: true, data: created }
}

export async function updatePrestataire(id: string, data: any) {
  await requirePermission('dossier.create')

  if (!data.nom.trim()) throw new Error('Le nom est requis.')

  const updated = await prisma.intervenant.update({
    where: { id },
    data: {
      nom: data.nom.trim(),
      email: data.email || null,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      contactPrincipal: data.contactPrincipal || null,
      contactRole: data.contactRole || null,
      siteWeb: data.siteWeb || null,
      notes: data.notes || null,
      actif: data.actif ?? true
    }
  })

  revalidatePath('/prestataires')
  return { success: true, data: updated }
}

export async function deletePrestataire(id: string) {
  await requirePermission('dossier.create')

  try {
    await prisma.intervenant.delete({ where: { id } })
  } catch (error: any) {
    if (error?.code === 'P2003') {
      // Clé étrangère liée aux dossiers
      return { error: 'Ce prestataire est lié à des dossiers. Veuillez le marquer Inactif à la place.' }
    }
    return { error: 'Erreur lors de la suppression.' }
  }

  revalidatePath('/prestataires')
  return { success: true }
}
