/**
 * Script de mise à jour – Résidence L'Ambassadeur
 * Période : mars–avril 2026
 * Source   : Compte rendu mars 2026 + échanges de mails avril 2026
 *
 * Ce script ajoute les nouvelles étapes sur les dossiers existants DOS-01 à DOS-11
 * et met à jour les statuts de DOS-03 et DOS-05.
 *
 * Usage : npx ts-node prisma/updates/update-avril-2026.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const AUTEUR = 'usr-oscar'

async function main() {
  console.log('🔄  Mise à jour dossiers – avril 2026')

  // ─── DOS-01 : Infiltration garage Mme Usanase ───
  await addEtapes('dos-01', [
    {
      titre: 'Rapport assurance copro reçu (Assurimo) – actions attendues',
      typeEtape: 'REPONSE_RECUE',
      statutEtape: 'TERMINEE',
      description: 'Rapport reçu le 18/03/2026. Transmis à Mme Usanase.',
      dateRealisation: new Date('2026-03-18'),
    },
    {
      titre: 'Assurance personnelle Mme Usanase : ne rentre pas en matière',
      typeEtape: 'REPONSE_RECUE',
      statutEtape: 'TERMINEE',
      description: 'Assurance copropriétaire Usanase décline la prise en charge de sa part.',
      dateRealisation: new Date('2026-03-18'),
    },
    {
      titre: 'Courrier protection juridique M. Andujar transmis au syndic',
      typeEtape: 'RELANCE',
      statutEtape: 'EN_ATTENTE',
      description: 'M. Andujar saisit la protection juridique de son assurance personnelle pour ce dossier.',
    },
  ])

  // ─── DOS-02 : Infiltrations caves ───
  await addEtapes('dos-02', [
    {
      titre: 'Rapport 31/03/2026 : humidité cave M. Conforto persistante, origine non identifiée',
      typeEtape: 'REPONSE_RECUE',
      statutEtape: 'TERMINEE',
      dateRealisation: new Date('2026-03-31'),
    },
  ])

  // ─── DOS-03 : Porte de garage – statut BLOQUE → EN_COURS ───
  await prisma.dossier.update({
    where: { id: 'dos-03' },
    data: { statut: 'EN_COURS' },
  })
  console.log('   ✓ DOS-03 statut : BLOQUE → EN_COURS')

  await addEtapes('dos-03', [
    {
      titre: 'Télécommandes commandées chez 2STP (copro voisine) – livraison en attente',
      typeEtape: 'DEVIS_VALIDE',
      statutEtape: 'EN_ATTENTE',
      description: 'Commande passée par M. Andujar le 27/04/2026. Livraison non encore reçue.',
      dateRealisation: new Date('2026-04-27'),
    },
    {
      titre: 'Mme Beni : mécanisme ouverture manuelle HS – agents poubelles bloqués',
      typeEtape: 'RELANCE',
      statutEtape: 'A_FAIRE',
      description: 'Ouverture manuelle de secours également défaillante. Intervention technicien nécessaire.',
    },
  ])

  // ─── DOS-05 : VMC – statut AFFECTE → EN_COURS ───
  await prisma.dossier.update({
    where: { id: 'dos-05' },
    data: { statut: 'EN_COURS' },
  })
  console.log('   ✓ DOS-05 statut : AFFECTE → EN_COURS')

  await addEtapes('dos-05', [
    {
      titre: 'Rapport AirForming 26/03/2026 – remplacement moteur VMC nécessaire',
      typeEtape: 'REPONSE_RECUE',
      statutEtape: 'TERMINEE',
      description: 'Rapport E2S / AirForming : moteur VMC défaillant, remplacement requis.',
      dateRealisation: new Date('2026-03-26'),
    },
    {
      titre: 'Devis moteur VMC validé par Pichet (14/04/2026 – ref. OSTW397912)',
      typeEtape: 'DEVIS_VALIDE',
      statutEtape: 'TERMINEE',
      description: 'Validation Aurélie Grillet / Pichet. Référence ordre de service : OSTW397912.',
      dateRealisation: new Date('2026-04-14'),
    },
    {
      titre: 'Relance Pichet pour date intervention VMC (21/04/2026)',
      typeEtape: 'RELANCE',
      statutEtape: 'EN_ATTENTE',
      description: 'M. Andujar relance Pichet. Pas de date confirmée à ce jour.',
      dateRealisation: new Date('2026-04-21'),
    },
  ])

  // ─── DOS-06 : Fuite local à ordures ───
  // Confirmation calendrier : RDV SAPITEC 02/04/2026 intitulé "SAPITEC (Local Ordures)"
  await addEtapes('dos-06', [
    {
      titre: 'Visite SAPITEC – recherche de fuite local à ordures (02/04/2026)',
      typeEtape: 'VISITE',
      statutEtape: 'TERMINEE',
      description: 'RDV confirmé par calendrier M. Andujar. Compte rendu d\'intervention à réceptionner.',
      dateRealisation: new Date('2026-04-02'),
    },
  ])

  // ─── DOS-08 : Éclairage façade ───
  await addEtapes('dos-08', [
    {
      titre: 'Devis GCCLAIMS – capteur crépusculaire soumis (14/04/2026 – ref. OSTW397910)',
      typeEtape: 'DEVIS_DEMANDE',
      statutEtape: 'TERMINEE',
      description: 'Devis soumis par Marc Niedziela (GCCLAIMS). Référence ordre de service : OSTW397910.',
      dateRealisation: new Date('2026-04-14'),
    },
    {
      titre: 'Devis validé par M. Andujar et Pichet (14/04/2026) – intervention à planifier',
      typeEtape: 'DEVIS_VALIDE',
      statutEtape: 'EN_ATTENTE',
      dateRealisation: new Date('2026-04-14'),
    },
  ])

  // ─── DOS-09 : Chaufferie – pompe + manque chauffage appts 11/12 ───
  await addEtapes('dos-09', [
    {
      titre: 'Pompe chaufferie remplacée dans le cadre du contrat P3 ENGIE – résolu',
      typeEtape: 'INTERVENTION_REALISEE',
      statutEtape: 'TERMINEE',
      description: 'Remplacement effectué. Dysfonctionnement pompe clos.',
    },
    {
      titre: 'Manque de chauffage appartements 11 et 12 – signalé par M. Andujar (02/04/2026)',
      typeEtape: 'CREATION',
      statutEtape: 'TERMINEE',
      dateRealisation: new Date('2026-04-02'),
    },
    {
      titre: 'ENGIE informé (M. Labrune) – servomoteurs défectueux suspectés – devis réactualisation en cours',
      typeEtape: 'DEVIS_DEMANDE',
      statutEtape: 'EN_ATTENTE',
      description: 'M. Labrune / ENGIE instruit le dossier. Devis de réactualisation des installations en préparation.',
    },
  ])

  // ─── DOS-10 : Chaufferie – rapport Walterre / plan d'action ───
  await addEtapes('dos-10', [
    {
      titre: 'Réunion ENGIE 03/04/2026 – plan d\'action immédiat chaufferie',
      typeEtape: 'VISITE',
      statutEtape: 'TERMINEE',
      description: 'Réunion avec ENGIE pour établir le plan d\'action chiffré et priorisé suite au rapport Walterre.',
      dateRealisation: new Date('2026-04-03'),
    },
  ])

  // ─── DOS-11 : Comptes 2024–2025 ───
  await addEtapes('dos-11', [
    {
      titre: 'Comptes 2024–2025 reçus de Pichet – arrêtés au 31/03/2025 (21/04/2026)',
      typeEtape: 'REPONSE_RECUE',
      statutEtape: 'TERMINEE',
      description: 'Envoi par Aurélie Grillet / Pichet le 21/04/2026.',
      dateRealisation: new Date('2026-04-21'),
    },
    {
      titre: 'Questions M. Conforto sur transfert des charges de chauffage (24/04/2026)',
      typeEtape: 'RELANCE',
      statutEtape: 'TERMINEE',
      description: 'M. Conforto interroge le mode de répartition des charges ECS transférées.',
      dateRealisation: new Date('2026-04-24'),
    },
    {
      titre: 'Pichet envoie tableau recalcul ECS + relevés Proxiserve (24/04/2026)',
      typeEtape: 'REPONSE_RECUE',
      statutEtape: 'TERMINEE',
      description: 'Tableau de recalcul eau chaude sanitaire et relevés Proxiserve transmis.',
      dateRealisation: new Date('2026-04-24'),
    },
    {
      titre: 'M. Conforto demande relevé Proxiserve individuel + explication méthode de calcul',
      typeEtape: 'RELANCE',
      statutEtape: 'EN_ATTENTE',
      description: 'Demande non encore satisfaite. Réponse Pichet attendue.',
    },
  ])

  console.log('✅  Mise à jour terminée !')
}

async function addEtapes(
  dossierId: string,
  etapes: Array<{
    titre: string
    typeEtape: string
    statutEtape: string
    description?: string
    dateRealisation?: Date
  }>
) {
  for (const e of etapes) {
    await prisma.dossierEtape.create({
      data: {
        dossierId,
        titre: e.titre,
        description: e.description || null,
        typeEtape: e.typeEtape as any,
        statutEtape: e.statutEtape as any,
        auteurUserId: AUTEUR,
        dateRealisation: e.dateRealisation || (e.statutEtape === 'TERMINEE' ? new Date() : null),
      },
    })
  }
  console.log(`   ✓ ${dossierId} – ${etapes.length} étape(s) ajoutée(s)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
