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

export async function syncPrestataires() {
  await requirePermission('settings.update.self') // Admin ou CS
  const copro = await prisma.copropriete.findFirst()
  if (!copro) throw new Error('Copropriété introuvable.')

  const intervenantsData = [
    { id: 'int-pichet', nom: 'Pichet Immobilier', type: 'SYNDIC' as const, sousType: 'Syndic', adresse: '7 Avenue du Pré Félin, 74940 Annecy-le-Vieux', telephone: '0450332500', contactPrincipal: 'Aurélie Grillet', contactRole: 'MANAGER', notes: 'Syndic principal' },
    { id: 'int-fg-plomberie', nom: 'FG Plomberie', type: 'PRESTATAIRE' as const, sousType: 'Plomberie', adresse: '278 Route des Alpes, 01280 Prévessin-Moëns', telephone: '0665543229', contactRole: 'TECHNICIAN', notes: 'Fuites et chauffage' },
    { id: 'int-engie', nom: 'EngieSolutions', type: 'PRESTATAIRE' as const, sousType: 'Chauffage', telephone: '0969399993', contactRole: 'GENERAL', notes: 'Maintenance chauffage' },
    { id: 'int-total-energies', nom: 'TotalEnergies', type: 'PRESTATAIRE' as const, sousType: 'Électricité', telephone: '0970806969', contactRole: 'GENERAL', notes: 'Fournisseur électricité' },
    { id: 'int-proxreserve', nom: 'Proxreserve', type: 'PRESTATAIRE' as const, sousType: 'Chauffage', telephone: '0977422424', contactRole: 'TECHNICIAN', notes: 'Maintenance thermique' },
    { id: 'int-schindler', nom: 'Schindler Savoie Léman', type: 'PRESTATAIRE' as const, sousType: 'Ascenseur', adresse: 'Viviers-du-Lac, 73420', telephone: '0479610450', contactRole: 'TECHNICIAN', notes: 'Maintenance ascenseur' },
    { id: 'int-A2C', nom: 'A2C Controle', type: 'PRESTATAIRE' as const, sousType: 'Ascenseur', telephone: '0450281350', contactRole: 'TECHNICIAN', notes: 'Contrôle réglementaire' },
    { id: 'int-altiscience', nom: 'Altiscience', type: 'PRESTATAIRE' as const, sousType: 'Toiture', contactRole: 'TECHNICIAN', notes: 'Recherche fuite toiture' },
    { id: 'int-melanno', nom: 'Melanno Zinguerie', type: 'PRESTATAIRE' as const, sousType: 'Étanchéité', contactRole: 'TECHNICIAN', notes: 'Travaux toiture' },
    { id: 'int-sapitec', nom: 'Sapitec', type: 'PRESTATAIRE' as const, sousType: 'Fuite', contactRole: 'TECHNICIAN', notes: 'Recherche de fuite' },
    { id: 'int-mccgy', nom: 'MCCGY', type: 'PRESTATAIRE' as const, sousType: 'Toiture', contactRole: 'TECHNICIAN', notes: 'Remplacement tuiles' },
    { id: 'int-socotec', nom: 'Socotec Immobilier Durable', type: 'PRESTATAIRE' as const, sousType: 'Diagnostic', adresse: 'Guyancourt, 78280', telephone: '0130124000', contactRole: 'GENERAL', notes: 'PPPT / DPE / DTG' },
    { id: 'int-gcc', nom: 'GLOBAL CONSTRUCTION CLAIMS', type: 'PRESTATAIRE' as const, sousType: 'Expertise', contactRole: 'EXPERT', notes: 'Sinistres' },
    { id: 'int-regie-eaux', nom: 'Régie des Eaux Gessiennes', type: 'PRESTATAIRE' as const, sousType: 'Eau', adresse: '200 rue Edouard Branly, 01280 Prévessin-Moëns', telephone: '0450991201', contactRole: 'GENERAL', notes: 'Eau' },
    { id: 'int-com-com-gex', nom: 'Communauté de Communes du Pays de Gex', type: 'PRESTATAIRE' as const, sousType: 'Déchets', adresse: '135 rue de Genève, 01170 Gex', telephone: '0450426500', contactRole: 'GENERAL', notes: 'Services publics' },
    { id: 'int-avipur', nom: 'Avipur', type: 'PRESTATAIRE' as const, sousType: 'Nuisibles', telephone: '0479521020', contactRole: 'TECHNICIAN', notes: 'Dératisation' },
    { id: 'int-sicli', nom: 'Sicli - Chubb France', type: 'PRESTATAIRE' as const, sousType: 'Incendie', telephone: '0820201202', contactRole: 'TECHNICIAN', notes: 'Désenfumage' },
    { id: 'int-leman-elec', nom: 'Leman Elec', type: 'PRESTATAIRE' as const, sousType: 'Électricité', contactRole: 'TECHNICIAN', notes: 'Dépannage' },
    { id: 'int-e2s', nom: 'E2S', type: 'PRESTATAIRE' as const, sousType: 'Maintenance', contactRole: 'TECHNICIAN', notes: 'Maintenance' },
    { id: 'int-2stp', nom: '2STP', type: 'PRESTATAIRE' as const, sousType: 'Accès', contactRole: 'TECHNICIAN', notes: 'Portes garage' },
    { id: 'int-pichon', nom: 'ESPACES VERTS PICHON', type: 'PRESTATAIRE' as const, sousType: 'Espaces verts', contactRole: 'TECHNICIAN', notes: 'Entretien extérieur' },
    { id: 'int-assurimo', nom: 'Assurimo', type: 'ASSURANCE' as const, sousType: 'Assurance', contactRole: 'GENERAL', notes: 'Assurance copro' },
    { id: 'int-set-assurances', nom: 'Set Assurances', type: 'ASSURANCE' as const, sousType: 'Assurance', contactRole: 'GENERAL', notes: 'Assurance' },
    { id: 'int-selarl-monnet', nom: 'Selarl Monnet-Héricault', type: 'AVOCAT' as const, sousType: 'Juridique', contactRole: 'GENERAL', notes: 'Recouvrement' },
    { id: 'int-docsyndic', nom: 'Docsyndic', type: 'PRESTATAIRE' as const, sousType: 'Syndic outils', contactRole: 'GENERAL', notes: 'Gestion administrative' },
    { id: 'int-volfeu', nom: 'VOLFEU', type: 'PRESTATAIRE' as const, sousType: 'Sécurité / Caméras' },
    { id: 'int-gex', nom: 'GEX MULTISERVICES', type: 'PRESTATAIRE' as const, sousType: 'Travaux + Espaces verts' },
    { id: 'int-walterre', nom: 'WALTERRE', type: 'EXPERT' as const, sousType: 'Audit chaufferie' },
    { id: 'int-chazelle', nom: 'Cabinet CHAZELLE / Me GEOFFRAY', type: 'AVOCAT' as const, sousType: 'Dossier FONCIA' },
    { id: 'int-persea', nom: 'Cabinet PERSEA', type: 'AVOCAT' as const, sousType: 'Contentieux' }
  ]

  let count = 0
  for (const i of intervenantsData) {
    await prisma.intervenant.upsert({
      where: { id: i.id },
      update: {}, // Ne pas écraser les modifications manuelles
      create: {
        id: i.id,
        coproprieteId: copro.id,
        nom: i.nom,
        type: i.type,
        sousType: i.sousType,
        adresse: (i as any).adresse || null,
        telephone: (i as any).telephone || null,
        contactPrincipal: (i as any).contactPrincipal || null,
        contactRole: (i as any).contactRole || null,
        notes: (i as any).notes || null,
        actif: true,
      },
    })
    count++
  }

  revalidatePath('/prestataires')
  return { success: true, message: `${count} prestataires synchronisés.` }
}
