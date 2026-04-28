/**
 * Script de mise à jour – Résidence L'Ambassadeur
 * Période : mars–avril 2026
 * Ajoute les étapes sur les dossiers existants DOS-01 à DOS-11 et met à jour les statuts
 * Attention : ne pas exécuter deux fois (les étapes sont créées sans vérification de doublon)
 */
'use strict'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const AUTEUR = 'usr-oscar'

async function addEtapes(dossierId, etapes) {
  for (const e of etapes) {
    await prisma.dossierEtape.create({
      data: {
        dossierId,
        titre: e.titre,
        description: e.description || null,
        typeEtape: e.typeEtape,
        statutEtape: e.statutEtape,
        auteurUserId: AUTEUR,
        dateRealisation: e.dateRealisation || (e.statutEtape === 'TERMINEE' ? new Date() : null),
      },
    })
  }
  console.log(`   ✓ ${dossierId} – ${etapes.length} étape(s) ajoutée(s)`)
}

async function main() {
  console.log('🔄  Mise à jour dossiers – mars/avril 2026')

  // DOS-01
  await addEtapes('dos-01', [
    { titre: 'Rapport assurance copro reçu (Assurimo) – actions attendues', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE', description: 'Rapport reçu le 18/03/2026. Transmis à Mme Usanase.', dateRealisation: new Date('2026-03-18') },
    { titre: 'Assurance personnelle Mme Usanase : ne rentre pas en matière', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE', description: "Assurance copropriétaire Usanase décline la prise en charge.", dateRealisation: new Date('2026-03-18') },
    { titre: 'Courrier protection juridique M. Andujar transmis au syndic', typeEtape: 'RELANCE', statutEtape: 'EN_ATTENTE', description: "M. Andujar saisit la protection juridique de son assurance personnelle." },
  ])

  // DOS-02
  await addEtapes('dos-02', [
    { titre: 'Rapport 31/03/2026 : humidité cave M. Conforto persistante, origine non identifiée', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-31') },
    { titre: 'Visite SAPITEC – recherche de fuite caves (avril 2026)', typeEtape: 'VISITE', statutEtape: 'TERMINEE', description: "RDV confirmé par M. Andujar. Compte rendu à réceptionner." },
  ])

  // DOS-03 – statut BLOQUE → EN_COURS
  await prisma.dossier.update({ where: { id: 'dos-03' }, data: { statut: 'EN_COURS' } })
  console.log('   ✓ DOS-03 statut : BLOQUE → EN_COURS')
  await addEtapes('dos-03', [
    { titre: 'Télécommandes commandées chez 2STP (copro voisine) – livraison en attente', typeEtape: 'DEVIS_VALIDE', statutEtape: 'EN_ATTENTE', description: 'Commande passée par M. Andujar le 27/04/2026.', dateRealisation: new Date('2026-04-27') },
    { titre: 'Mme Beni : mécanisme ouverture manuelle HS – agents poubelles bloqués', typeEtape: 'RELANCE', statutEtape: 'A_FAIRE', description: 'Ouverture manuelle de secours également défaillante.' },
  ])

  // DOS-05 – statut AFFECTE → EN_COURS
  await prisma.dossier.update({ where: { id: 'dos-05' }, data: { statut: 'EN_COURS' } })
  console.log('   ✓ DOS-05 statut : AFFECTE → EN_COURS')
  await addEtapes('dos-05', [
    { titre: 'Rapport AirForming 26/03/2026 – remplacement moteur VMC nécessaire', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-26') },
    { titre: 'Devis moteur VMC validé par Pichet (14/04/2026 – ref. OSTW397912)', typeEtape: 'DEVIS_VALIDE', statutEtape: 'TERMINEE', description: 'Validation Aurélie Grillet / Pichet.', dateRealisation: new Date('2026-04-14') },
    { titre: 'Relance Pichet pour date intervention VMC (21/04/2026)', typeEtape: 'RELANCE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-21') },
    { titre: 'Intervention AirForming – remplacement moteur VMC réalisé (27/04/2026)', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE', description: 'AirForming intervient sur site. Moteur remplacé. Compte rendu à réceptionner.', dateRealisation: new Date('2026-04-27') },
  ])

  // DOS-06
  await addEtapes('dos-06', [
    { titre: 'Visite SAPITEC – recherche de fuite local à ordures (02/04/2026)', typeEtape: 'VISITE', statutEtape: 'TERMINEE', description: "RDV confirmé par calendrier M. Andujar (\"SAPITEC (Local Ordures)\"). Compte rendu à réceptionner.", dateRealisation: new Date('2026-04-02') },
  ])

  // DOS-08
  await addEtapes('dos-08', [
    { titre: 'Devis GCCLAIMS – capteur crépusculaire soumis (14/04/2026 – ref. OSTW397910)', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE', description: 'Devis soumis par Marc Niedziela (GCCLAIMS).', dateRealisation: new Date('2026-04-14') },
    { titre: 'Devis validé par M. Andujar et Pichet (14/04/2026)', typeEtape: 'DEVIS_VALIDE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-14') },
    { titre: 'Intervention GCCLAIMS – pose capteur crépusculaire réalisée (avril 2026)', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE', description: 'RDV tenu avec Marc Niedziela. Capteur posé sur façade. Compte rendu à réceptionner.' },
  ])

  // DOS-09
  await addEtapes('dos-09', [
    { titre: 'Pompe chaufferie remplacée – contrat P3 ENGIE (résolu)', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE' },
    { titre: 'Manque de chauffage appartements 11 et 12 – signalé par M. Andujar (02/04/2026)', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-02') },
    { titre: 'ENGIE informé (M. Labrune) – servomoteurs défectueux suspectés – devis réactualisation en cours', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'EN_ATTENTE', description: 'Devis de réactualisation des installations en préparation.' },
  ])

  // DOS-10
  await addEtapes('dos-10', [
    { titre: "Réunion ENGIE 03/04/2026 – plan d'action immédiat chaufferie", typeEtape: 'VISITE', statutEtape: 'TERMINEE', description: "Réunion pour établir le plan d'action chiffré suite au rapport Walterre.", dateRealisation: new Date('2026-04-03') },
  ])

  // DOS-11
  await addEtapes('dos-11', [
    { titre: 'Comptes 2024–2025 reçus de Pichet – arrêtés au 31/03/2025 (21/04/2026)', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE', description: 'Envoi par Aurélie Grillet / Pichet le 21/04/2026.', dateRealisation: new Date('2026-04-21') },
    { titre: 'Questions M. Conforto sur transfert des charges de chauffage (24/04/2026)', typeEtape: 'RELANCE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-24') },
    { titre: 'Pichet envoie tableau recalcul ECS + relevés Proxiserve (24/04/2026)', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-24') },
    { titre: 'M. Conforto demande relevé Proxiserve individuel + explication méthode de calcul', typeEtape: 'RELANCE', statutEtape: 'EN_ATTENTE', description: 'Demande non encore satisfaite. Réponse Pichet attendue.' },
  ])

  console.log('✅  Mise à jour terminée !')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
