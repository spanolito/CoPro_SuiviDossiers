/**
 * Script d'ajout – Résidence L'Ambassadeur
 * Nouveaux intervenants + nouveaux dossiers DOS-13 / DOS-14 / DOS-15
 * Utilise upsert : sans danger si exécuté plusieurs fois
 *
 * Usage : npx ts-node prisma/updates/add-new-data-avril-2026.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const COPRO_ID = 'copro-ambassadeur'
const BAT_ID   = 'bat-ambassadeur'
const OSCAR    = 'usr-oscar'
const CATIA    = 'usr-catia'

async function main() {
  console.log('🔄  Ajout nouveaux intervenants et dossiers – avril 2026')

  // ─── 1. Nouveaux intervenants ───
  const newIntervenants = [
    {
      id: 'int-gcclaims',
      nom: 'GCCLAIMS',
      type: 'PRESTATAIRE' as const,
      sousType: 'Électricité / Éclairage',
      contactPrincipal: 'Marc Niedziela',
      email: 'mniedziela@gcclaims.fr',
      contactRole: 'TECHNICIAN',
      notes: 'Pose capteur crépusculaire façade (ref. OSTW397910 – avril 2026)',
    },
    {
      id: 'int-lpe',
      nom: 'SARL LPE',
      type: 'PRESTATAIRE' as const,
      sousType: 'Étanchéité / Toiture',
      adresse: '125 Route des Creuses, 74650 Chavanod',
      contactPrincipal: 'Pierre-Emmanuel Labeaune',
      email: 'contact@sarl-lpe.fr',
      contactRole: 'TECHNICIAN',
      notes: 'Intervention toiture appartement Beni – test fumigène 02/04/2026',
    },
    {
      id: 'int-groupama',
      nom: 'Groupama Grand Est',
      type: 'ASSURANCE' as const,
      sousType: 'Assurance personnelle',
      contactRole: 'GENERAL',
      notes: 'Assurance personnelle M. Andujar – contrat 73078057D-230 – sinistre ref. 2026012366',
    },
    {
      id: 'int-elex',
      nom: 'ELEX ANNECY',
      type: 'EXPERT' as const,
      sousType: 'Expertise dégâts des eaux',
      adresse: '84 route de Vieran, 74371 Pringy Cedex',
      telephone: '0450235731',
      contactRole: 'EXPERT',
      notes: 'Expert mandaté sinistre DDE appartement Andujar',
    },
    {
      id: 'int-hydrosolutions',
      nom: 'HydroSolutions',
      type: 'PRESTATAIRE' as const,
      sousType: 'Recherche de fuite',
      contactRole: 'TECHNICIAN',
      notes: 'Recherche de fuite',
    },
  ]

  for (const i of newIntervenants) {
    await prisma.intervenant.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        coproprieteId: COPRO_ID,
        nom: i.nom,
        type: i.type,
        sousType: i.sousType,
        adresse: (i as any).adresse || null,
        telephone: (i as any).telephone || null,
        email: (i as any).email || null,
        contactPrincipal: (i as any).contactPrincipal || null,
        contactRole: (i as any).contactRole || null,
        notes: (i as any).notes || null,
        actif: true,
      },
    })
    console.log(`   ✓ Intervenant : ${i.nom}`)
  }

  // ─── 2. Nouveaux dossiers ───

  // DOS-13 : Fuite toiture – appartement Mme Beni
  const dos13 = await prisma.dossier.upsert({
    where: { id: 'dos-13' },
    update: {},
    create: {
      id: 'dos-13',
      coproprieteId: COPRO_ID,
      batimentId: BAT_ID,
      reference: 'DOS-2026-0013',
      titre: 'Fuite toiture – appartement Mme Beni',
      description: 'Infiltration depuis la toiture constatée (cloques plafond). Altiscience mandatée, LPE intervient le 02/04/2026 (test fumigène, 5 cm eau sous étanchéité, joint réparé). Devis complémentaire LPE validé le 15/04/2026.',
      typeDossier: 'SINISTRE',
      statut: 'EN_COURS',
      priorite: 'HAUTE',
      responsableCSId: CATIA,
      createurUserId: OSCAR,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-lpe',
      coproprietaireConcerneId: 'cp-catia',
      zoneCommuneId: 'zc-toiture',
      typeLocalisation: 'TOITURE',
    },
  })

  if (dos13) {
    const etapes13 = await prisma.dossierEtape.count({ where: { dossierId: 'dos-13' } })
    if (etapes13 === 0) {
      const etapesData = [
        { titre: 'Cloques plafond constatées – signalement Mme Beni', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-01-15') },
        { titre: 'Altiscience mandatée pour recherche fuite toiture', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-02-01') },
        { titre: 'LPE intervient – test fumigène, 5 cm eau sous étanchéité, joint réparé (02/04/2026)', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE', description: 'Pierre-Emmanuel Labeaune – SARL LPE', dateRealisation: new Date('2026-04-02') },
        { titre: 'Devis complémentaire LPE soumis (09/04/2026)', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-09') },
        { titre: 'Devis LPE validé (15/04/2026) – intervention complémentaire à planifier', typeEtape: 'DEVIS_VALIDE', statutEtape: 'EN_ATTENTE', dateRealisation: new Date('2026-04-15') },
      ]
      for (const e of etapesData) {
        await prisma.dossierEtape.create({ data: { dossierId: 'dos-13', titre: e.titre, description: (e as any).description || null, typeEtape: e.typeEtape as any, statutEtape: e.statutEtape as any, auteurUserId: OSCAR, dateRealisation: e.dateRealisation } })
      }
      console.log('   ✓ DOS-13 créé avec 5 étapes')
    } else {
      console.log('   ↩ DOS-13 existe déjà – étapes ignorées')
    }
  }

  // DOS-14 : Remplacement chaudière horizon 2027
  const dos14 = await prisma.dossier.upsert({
    where: { id: 'dos-14' },
    update: {},
    create: {
      id: 'dos-14',
      coproprieteId: COPRO_ID,
      batimentId: BAT_ID,
      reference: 'DOS-2026-0014',
      titre: 'Remplacement chaudière collective – horizon 2027',
      description: 'Chaudière surdimensionnée et vieillissante identifiée par le rapport Walterre. Remplacement à planifier à l\'horizon 2027, sujet évoqué en AG 2026, votation des copropriétaires nécessaire.',
      typeDossier: 'CHAUFFAGE',
      statut: 'EN_COURS',
      priorite: 'BASSE',
      responsableCSId: OSCAR,
      createurUserId: OSCAR,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-engie',
      zoneCommuneId: 'zc-chaufferie',
      typeLocalisation: 'EQUIPEMENT_TECHNIQUE',
      typeInstallation: 'Chaudière collective gaz',
    },
  })

  if (dos14) {
    const etapes14 = await prisma.dossierEtape.count({ where: { dossierId: 'dos-14' } })
    if (etapes14 === 0) {
      const etapesData = [
        { titre: 'Diagnostic Walterre – chaudière surdimensionnée et vieillissante identifiée', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2025-11-01') },
        { titre: 'Sujet évoqué en AG 2026 – votation nécessaire', typeEtape: 'DECISION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-01') },
        { titre: 'Remplacement planifié à l\'horizon 2027 – devis à obtenir', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'A_FAIRE' },
      ]
      for (const e of etapesData) {
        await prisma.dossierEtape.create({ data: { dossierId: 'dos-14', titre: e.titre, typeEtape: e.typeEtape as any, statutEtape: e.statutEtape as any, auteurUserId: OSCAR, dateRealisation: (e as any).dateRealisation || null } })
      }
      console.log('   ✓ DOS-14 créé avec 3 étapes')
    } else {
      console.log('   ↩ DOS-14 existe déjà – étapes ignorées')
    }
  }

  // DOS-15 : Dégâts des eaux – appartement M. Andujar
  const dos15 = await prisma.dossier.upsert({
    where: { id: 'dos-15' },
    update: {},
    create: {
      id: 'dos-15',
      coproprieteId: COPRO_ID,
      batimentId: BAT_ID,
      reference: 'DOS-2026-0015',
      titre: 'Dégâts des eaux – appartement M. Andujar',
      description: 'Fuite arrivée/retour eau chaude dans l\'armoire d\'entrée le 02/03/2026, plancher soulevé. Sinistre déclaré GROUPAMA (ref. 2026012366). Expert ELEX ANNECY mandaté. Grillet informe assurance immeuble le 20/04/2026. Attente constat DDE et facture suppression cause.',
      typeDossier: 'SINISTRE',
      statut: 'EN_COURS',
      priorite: 'HAUTE',
      responsableCSId: OSCAR,
      createurUserId: OSCAR,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-elex',
      responsableActionId: 'int-groupama',
      coproprietaireConcerneId: 'cp-oscar',
      typeLocalisation: 'APPARTEMENT_PRIVATIF',
    },
  })

  if (dos15) {
    const etapes15 = await prisma.dossierEtape.count({ where: { dossierId: 'dos-15' } })
    if (etapes15 === 0) {
      const etapesData = [
        { titre: 'Fuite arrivée/retour eau chaude – armoire entrée, plancher soulevé (02/03/2026)', typeEtape: 'CREATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-02') },
        { titre: 'Sinistre déclaré assurance personnelle GROUPAMA (ref. 2026012366)', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-05') },
        { titre: 'Expert ELEX ANNECY mandaté', typeEtape: 'VISITE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-03-10') },
        { titre: 'Grillet (Pichet) informe assurance immeuble (20/04/2026)', typeEtape: 'RELANCE', statutEtape: 'TERMINEE', dateRealisation: new Date('2026-04-20') },
        { titre: 'Attente constat DDE de l\'expert ELEX', typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE' },
        { titre: 'Attente facture de suppression de cause', typeEtape: 'REPONSE_RECUE', statutEtape: 'A_FAIRE' },
      ]
      for (const e of etapesData) {
        await prisma.dossierEtape.create({ data: { dossierId: 'dos-15', titre: e.titre, typeEtape: e.typeEtape as any, statutEtape: e.statutEtape as any, auteurUserId: OSCAR, dateRealisation: (e as any).dateRealisation || null } })
      }
      console.log('   ✓ DOS-15 créé avec 6 étapes')
    } else {
      console.log('   ↩ DOS-15 existe déjà – étapes ignorées')
    }
  }

  console.log('✅  Ajout terminé !')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
