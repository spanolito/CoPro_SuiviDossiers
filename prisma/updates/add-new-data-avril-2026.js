/**
 * Script d'ajout – Résidence L'Ambassadeur
 * Nouveaux intervenants + nouveaux dossiers DOS-13 / DOS-14 / DOS-15
 * Idempotent : sans danger si exécuté plusieurs fois
 */
'use strict'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const COPRO_ID = 'copro-ambassadeur'
const BAT_ID   = 'bat-ambassadeur'
const OSCAR    = 'usr-oscar'
const CATIA    = 'usr-catia'

async function main() {
  console.log('🔄  Ajout nouveaux intervenants et dossiers – avril 2026')

  // ─── 1. Nouveaux intervenants ───
  const newIntervenants = [
    { id: 'int-gcclaims', nom: 'GCCLAIMS', type: 'PRESTATAIRE', sousType: 'Électricité / Éclairage', contactPrincipal: 'Marc Niedziela', email: 'mniedziela@gcclaims.fr', contactRole: 'TECHNICIAN', notes: 'Pose capteur crépusculaire façade – ref. OSTW397910 – avril 2026' },
    { id: 'int-lpe', nom: 'SARL LPE', type: 'PRESTATAIRE', sousType: 'Étanchéité / Toiture', adresse: '125 Route des Creuses, 74650 Chavanod', contactPrincipal: 'Pierre-Emmanuel Labeaune', email: 'contact@sarl-lpe.fr', contactRole: 'TECHNICIAN', notes: 'Intervention toiture appartement Beni – 02/04/2026' },
    { id: 'int-groupama', nom: 'Groupama Grand Est', type: 'ASSURANCE', sousType: 'Assurance personnelle', contactRole: 'GENERAL', notes: 'Assurance M. Andujar – contrat 73078057D-230 – sinistre 2026012366' },
    { id: 'int-elex', nom: 'ELEX ANNECY', type: 'EXPERT', sousType: 'Expertise dégâts des eaux', adresse: '84 route de Vieran, 74371 Pringy Cedex', telephone: '0450235731', contactRole: 'EXPERT', notes: 'Expert sinistre DDE appartement Andujar' },
    { id: 'int-hydrosolutions', nom: 'HydroSolutions', type: 'PRESTATAIRE', sousType: 'Recherche de fuite', contactRole: 'TECHNICIAN', notes: 'Recherche de fuite' },
  ]

  for (const i of newIntervenants) {
    await prisma.intervenant.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id, coproprieteId: COPRO_ID, nom: i.nom, type: i.type,
        sousType: i.sousType || null, adresse: i.adresse || null,
        telephone: i.telephone || null, email: i.email || null,
        contactPrincipal: i.contactPrincipal || null, contactRole: i.contactRole || null,
        notes: i.notes || null, actif: true,
      },
    })
    console.log(`   ✓ Intervenant : ${i.nom}`)
  }

  // ─── 2. DOS-13 : Fuite toiture – appartement Mme Beni ───
  await prisma.dossier.upsert({
    where: { id: 'dos-13' }, update: {},
    create: {
      id: 'dos-13', coproprieteId: COPRO_ID, batimentId: BAT_ID,
      reference: 'DOS-2026-0013', titre: 'Fuite toiture – appartement Mme Beni',
      description: "Infiltration depuis la toiture (cloques plafond). Altiscience mandatée. LPE intervient le 02/04/2026 : test fumigène, 5 cm eau sous étanchéité, joint réparé. Devis complémentaire LPE validé le 15/04/2026.",
      typeDossier: 'SINISTRE', statut: 'EN_COURS', priorite: 'HAUTE',
      responsableCSId: CATIA, createurUserId: OSCAR,
      syndicImpliqueId: 'int-pichet', prestatairePrincipalId: 'int-lpe',
      coproprietaireConcerneId: 'cp-catia', zoneCommuneId: 'zc-toiture',
      typeLocalisation: 'TOITURE',
    },
  })
  const count13 = await prisma.dossierEtape.count({ where: { dossierId: 'dos-13' } })
  if (count13 === 0) {
    for (const e of [
      { titre: 'Cloques plafond constatées – signalement Mme Beni', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-01-15') },
      { titre: 'Altiscience mandatée pour recherche fuite toiture', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-02-01') },
      { titre: 'LPE intervient – test fumigène, 5 cm eau sous étanchéité, joint réparé (02/04/2026)', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE', description: 'Pierre-Emmanuel Labeaune – SARL LPE', dateRealisation: new Date('2026-04-02') },
      { titre: 'Devis complémentaire LPE soumis (09/04/2026)', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-09') },
      { titre: 'Devis LPE validé (15/04/2026) – intervention complémentaire à planifier', typeEtape: 'DEVIS_VALIDE', statutEtape: 'EN_ATTENTE', dateRealisation: new Date('2026-04-15') },
    ]) {
      await prisma.dossierEtape.create({ data: { dossierId: 'dos-13', titre: e.titre, description: e.description || null, typeEtape: e.typeEtape, statutEtape: e.statutEtape, auteurUserId: OSCAR, dateRealisation: e.dateRealisation || null } })
    }
    console.log('   ✓ DOS-13 créé avec 5 étapes')
  } else { console.log('   ↩ DOS-13 existe déjà') }

  // ─── 3. DOS-14 : Remplacement chaudière – horizon 2027 ───
  await prisma.dossier.upsert({
    where: { id: 'dos-14' }, update: {},
    create: {
      id: 'dos-14', coproprieteId: COPRO_ID, batimentId: BAT_ID,
      reference: 'DOS-2026-0014', titre: 'Remplacement chaudière collective – horizon 2027',
      description: "Chaudière surdimensionnée identifiée par rapport Walterre. Remplacement planifié à l'horizon 2027, votation copropriétaires nécessaire.",
      typeDossier: 'CHAUFFAGE', statut: 'EN_COURS', priorite: 'BASSE',
      responsableCSId: OSCAR, createurUserId: OSCAR,
      syndicImpliqueId: 'int-pichet', prestatairePrincipalId: 'int-engie',
      zoneCommuneId: 'zc-chaufferie', typeLocalisation: 'EQUIPEMENT_TECHNIQUE',
      typeInstallation: 'Chaudière collective gaz',
    },
  })
  const count14 = await prisma.dossierEtape.count({ where: { dossierId: 'dos-14' } })
  if (count14 === 0) {
    for (const e of [
      { titre: 'Diagnostic Walterre – chaudière surdimensionnée identifiée', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2025-11-01') },
      { titre: 'Sujet évoqué en AG 2026 – votation nécessaire', typeEtape: 'DECISION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-01') },
      { titre: "Remplacement planifié horizon 2027 – devis à obtenir", typeEtape: 'DEVIS_DEMANDE', statutEtape: 'A_FAIRE' },
    ]) {
      await prisma.dossierEtape.create({ data: { dossierId: 'dos-14', titre: e.titre, typeEtape: e.typeEtape, statutEtape: e.statutEtape, auteurUserId: OSCAR, dateRealisation: e.dateRealisation || null } })
    }
    console.log('   ✓ DOS-14 créé avec 3 étapes')
  } else { console.log('   ↩ DOS-14 existe déjà') }

  // ─── 4. DOS-15 : Dégâts des eaux – appartement M. Andujar ───
  await prisma.dossier.upsert({
    where: { id: 'dos-15' }, update: {},
    create: {
      id: 'dos-15', coproprieteId: COPRO_ID, batimentId: BAT_ID,
      reference: 'DOS-2026-0015', titre: "Dégâts des eaux – appartement M. Andujar",
      description: "Fuite arrivée/retour eau chaude armoire entrée le 02/03/2026, plancher soulevé. Sinistre déclaré GROUPAMA (ref. 2026012366). Expert ELEX ANNECY mandaté. Grillet informe assurance immeuble le 20/04/2026.",
      typeDossier: 'SINISTRE', statut: 'EN_COURS', priorite: 'HAUTE',
      responsableCSId: OSCAR, createurUserId: OSCAR,
      syndicImpliqueId: 'int-pichet', prestatairePrincipalId: 'int-elex',
      responsableActionId: 'int-groupama', coproprietaireConcerneId: 'cp-oscar',
      typeLocalisation: 'APPARTEMENT_PRIVATIF',
    },
  })
  const count15 = await prisma.dossierEtape.count({ where: { dossierId: 'dos-15' } })
  if (count15 === 0) {
    for (const e of [
      { titre: 'Fuite arrivée/retour eau chaude – armoire entrée, plancher soulevé (02/03/2026)', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-02') },
      { titre: 'Sinistre déclaré assurance personnelle GROUPAMA (ref. 2026012366)', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-05') },
      { titre: 'Expert ELEX ANNECY mandaté', typeEtape: 'VISITE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-10') },
      { titre: 'Grillet (Pichet) informe assurance immeuble (20/04/2026)', typeEtape: 'RELANCE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-20') },
      { titre: "Attente constat DDE de l'expert ELEX", typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE' },
      { titre: 'Attente facture de suppression de cause', typeEtape: 'REPONSE_RECUE', statutEtape: 'A_FAIRE' },
    ]) {
      await prisma.dossierEtape.create({ data: { dossierId: 'dos-15', titre: e.titre, typeEtape: e.typeEtape, statutEtape: e.statutEtape, auteurUserId: OSCAR, dateRealisation: e.dateRealisation || null } })
    }
    console.log('   ✓ DOS-15 créé avec 6 étapes')
  } else { console.log('   ↩ DOS-15 existe déjà') }

  console.log('✅  Ajout terminé !')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
