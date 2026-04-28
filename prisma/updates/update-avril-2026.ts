/**
 * Script de mise à jour – Résidence L'Ambassadeur
 * Période : mars–avril 2026
 * Source   : Compte rendu mars 2026 + échanges de mails avril 2026
 *
 * Ce script ajoute les nouvelles étapes sur les dossiers DOS-01 à DOS-11,
 * crée les intervenants LPE / ELEX / Groupama, et crée les dossiers DOS-13 à DOS-15
 * (fuite toiture, remplacement chaudière, DDE Andujar) avec leurs étapes.
 * Met également à jour les statuts de DOS-03 et DOS-05.
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
    {
      titre: 'Visite SAPITEC – recherche de fuite caves (avril 2026)',
      typeEtape: 'VISITE',
      statutEtape: 'TERMINEE',
      description: 'RDV confirmé par M. Andujar. Compte rendu d\'intervention à réceptionner.',
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
      statutEtape: 'TERMINEE',
      description: 'M. Andujar relance Pichet. Date obtenue.',
      dateRealisation: new Date('2026-04-21'),
    },
    {
      titre: 'Intervention AirForming – remplacement moteur VMC réalisé (27/04/2026)',
      typeEtape: 'INTERVENTION_REALISEE',
      statutEtape: 'TERMINEE',
      description: 'AirForming intervient sur site le 27/04/2026. Remplacement moteur VMC effectué. Compte rendu à réceptionner.',
      dateRealisation: new Date('2026-04-27'),
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
      titre: 'Devis validé par M. Andujar et Pichet (14/04/2026)',
      typeEtape: 'DEVIS_VALIDE',
      statutEtape: 'TERMINEE',
      dateRealisation: new Date('2026-04-14'),
    },
    {
      titre: 'Intervention GCCLAIMS – pose capteur crépusculaire (avril 2026)',
      typeEtape: 'INTERVENTION_REALISEE',
      statutEtape: 'TERMINEE',
      description: 'RDV tenu avec Marc Niedziela (GCCLAIMS). Capteur crépusculaire posé sur façade. Compte rendu à réceptionner.',
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

  // ─── Intervenants manquants (LPE, ELEX, Groupama) ───
  const coproprieteId = 'copro-ambassadeur'
  for (const iv of [
    {
      id: 'int-lpe', nom: 'SARL LPE', type: 'PRESTATAIRE', sousType: 'Étanchéité / Toiture',
      adresse: '125 Route des Creuses, 74650 Chavanod',
      contactPrincipal: 'Pierre-Emmanuel Labeaune',
      email: 'contact@sarl-lpe.fr', telephone: '0788985652',
      contactRole: 'TECHNICIAN',
      notes: 'Intervention toiture – test fumigène 02/04/2026',
    },
    {
      id: 'int-elex', nom: 'ELEX ANNECY', type: 'EXPERT', sousType: 'Expertise dégâts des eaux',
      adresse: '84 route de Vieran, 74371 Pringy Cedex',
      telephone: '0450235731',
      contactRole: 'EXPERT',
      notes: 'Expert mandaté sinistre DDE Andujar – ref. 2026012366',
    },
    {
      id: 'int-groupama', nom: 'Groupama Grand Est', type: 'ASSURANCE', sousType: 'Assurance personnelle',
      contactRole: 'GENERAL',
      notes: 'Assurance personnelle M. Andujar – contrat 73078057D-230 – ref. 2026012366',
    },
  ] as any[]) {
    await prisma.intervenant.upsert({
      where: { id: iv.id },
      update: {},
      create: { ...iv, coproprieteId },
    })
    console.log(`   ✓ Intervenant ${iv.id} créé/vérifié`)
  }

  // ─── DOS-2026-0014 "Fuite Toit" (ID réel : cmncrkj0c0001l204jvimve8x) ───
  // Dossier existant créé dans l'app. On ajoute les étapes manquantes (devis + validation).
  const idFuiteToiture = 'cmncrkj0c0001l204jvimve8x'
  await prisma.dossier.update({
    where: { id: idFuiteToiture },
    data: {
      titre: 'Fuite toiture – appartement Mme Beni',
      description: 'Infiltration depuis la toiture (cloques plafond). Altiscience mandatée. LPE intervient le 02/04/2026 : test fumigène, 5 cm eau sous étanchéité, joint réparé. Devis complémentaire LPE validé le 15/04/2026.',
      prestatairePrincipalId: 'int-lpe',
    },
  })
  await addEtapes(idFuiteToiture, [
    {
      titre: 'Devis complémentaire LPE soumis par Pichet (09/04/2026 – réf. DEV260544)',
      typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE',
      description: 'Chiffrage LPE transmis au CS. Validation tacite demandée avant le 13/04/2026.',
      dateRealisation: new Date('2026-04-09'),
    },
    {
      titre: 'Devis LPE validé et signé par Pichet (15/04/2026)',
      typeEtape: 'DEVIS_VALIDE', statutEtape: 'EN_ATTENTE',
      description: 'Document signé : LPE-SINISTRESBENI-SIGNE.pdf. Intervention complémentaire (pompage eau sous étanchéité) à planifier.',
      dateRealisation: new Date('2026-04-15'),
    },
  ])
  console.log('   ✓ Fuite toiture (cmncrkj0c) – étapes devis ajoutées')

  // ─── DOS-2026-0016 : Dégâts des eaux – appartement M. Andujar (nouveau) ───
  const dosDDE = await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-0016' },
    update: {},
    create: {
      coproprieteId,
      batimentId: 'bat-ambassadeur',
      reference: 'DOS-2026-0016',
      titre: 'Dégâts des eaux – appartement M. Andujar',
      description: 'Fuite arrivée/retour eau chaude dans l\'armoire d\'entrée le 02/03/2026, plancher soulevé. Sinistre déclaré GROUPAMA (ref. 2026012366). Expert ELEX ANNECY mandaté. Grillet informe assurance immeuble le 20/04/2026. Attente constat DDE et facture suppression cause.',
      typeDossier: 'SINISTRE',
      statut: 'EN_COURS',
      priorite: 'HAUTE',
      responsableCSId: AUTEUR,
      createurUserId: AUTEUR,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-elex',
      responsableActionId: 'int-groupama',
      coproprietaireConcerneId: 'cp-oscar',
      typeLocalisation: 'APPARTEMENT_PRIVATIF',
    },
  })
  console.log(`   ✓ DOS-2026-0016 DDE Andujar créé (id: ${dosDDE.id})`)
  await addEtapes(dosDDE.id, [
    {
      titre: 'Fuite arrivée/retour eau chaude – armoire entrée appartement, plancher soulevé (02/03/2026)',
      typeEtape: 'CREATION', statutEtape: 'TERMINEE',
      description: 'Tuyaux visibles dans l\'armoire d\'entrée. Dépôt de calcaire dans les raccords.',
      dateRealisation: new Date('2026-03-02'),
    },
    {
      titre: 'Sinistre déclaré – GROUPAMA Grand Est (ref. 2026012366, contrat 73078057D-230)',
      typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE',
    },
    {
      titre: 'Expert ELEX ANNECY mandaté par assurance (04 50 23 57 31 – Pringy)',
      typeEtape: 'VISITE', statutEtape: 'TERMINEE',
      description: '84 route de Vieran, 74371 Pringy Cedex. Mission expertise DDE.',
    },
    {
      titre: 'Convocation expertise reçue par Pichet – Grillet demande détails à M. Andujar (17/04/2026)',
      typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE',
      description: 'Pichet découvre le sinistre via convocation ASSURIMO / GROUPAMA. Grillet demande précisions à M. Andujar.',
      dateRealisation: new Date('2026-04-17'),
    },
    {
      titre: 'M. Andujar explique : fuite localisée dans l\'appartement, tuyaux armoire entrée (20/04/2026)',
      typeEtape: 'RELANCE', statutEtape: 'TERMINEE',
      description: 'Fuite sur arrivée/retour eau chaude dans armoire entrée. Plancher soulevé. Assurances personnelle et immeuble à coordonner.',
      dateRealisation: new Date('2026-04-20'),
    },
    {
      titre: 'Pichet (Grillet) transmet à l\'assurance immeuble (Assurimo) (20/04/2026)',
      typeEtape: 'RELANCE', statutEtape: 'TERMINEE',
      dateRealisation: new Date('2026-04-20'),
    },
    {
      titre: 'Attente CONSTAT DDE signé des deux parties',
      typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE',
      description: 'Document demandé par ASSURIMO / GROUPAMA. Nécessaire pour prise en charge sinistre.',
    },
    {
      titre: 'Attente facture de suppression de cause',
      typeEtape: 'REPONSE_RECUE', statutEtape: 'A_FAIRE',
      description: 'Facture à fournir à l\'assurance pour clôturer la prise en charge.',
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
