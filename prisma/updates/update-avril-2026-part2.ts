/**
 * Script de mise à jour – Résidence L'Ambassadeur – Partie 2
 * Cible : dossiers créés via l'app (fuite toiture, DDE Andujar) + nouveaux intervenants
 * Source : Échanges de mails – avril 2026
 *
 * Usage : npx ts-node prisma/updates/update-avril-2026-part2.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const AUTEUR = 'usr-oscar'
const COPROPRIETE_ID = 'copro-ambassadeur'

async function main() {
  console.log('🔄  Mise à jour dossiers – avril 2026 (partie 2)')

  // ─── Créer les intervenants manquants ───
  for (const iv of [
    {
      id: 'int-lpe', nom: 'SARL LPE', type: 'PRESTATAIRE', sousType: 'Étanchéité / Toiture',
      adresse: '125 Route des Creuses, 74650 Chavanod',
      contactPrincipal: 'Pierre-Emmanuel Labeaune',
      email: 'contact@sarl-lpe.fr', telephone: '0788985652',
      contactRole: 'TECHNICIAN',
      notes: 'Intervention toiture appartement Beni – test fumigène 02/04/2026',
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
      create: { ...iv, coproprieteId: COPROPRIETE_ID },
    })
    console.log(`   ✓ Intervenant ${iv.id} créé/vérifié`)
  }

  // ─── Fuite toiture Mme Beni (dossier existant DOS-2026-0014 dans l'app) ───
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
  console.log('   ✓ Fuite toiture – 2 étapes ajoutées')

  // ─── DDE Andujar (nouveau dossier DOS-2026-0016) ───
  const dosDDE = await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-0016' },
    update: {},
    create: {
      coproprieteId: COPROPRIETE_ID,
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
      titre: 'Fuite arrivée/retour eau chaude – armoire entrée, plancher soulevé (02/03/2026)',
      typeEtape: 'CREATION', statutEtape: 'TERMINEE',
      description: 'Tuyaux visibles dans l\'armoire d\'entrée. Dépôt de calcaire dans les raccords. Assurance personnelle Andujar impliquée.',
      dateRealisation: new Date('2026-03-02'),
    },
    {
      titre: 'Sinistre déclaré – GROUPAMA Grand Est (ref. 2026012366, contrat 73078057D-230)',
      typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE',
    },
    {
      titre: 'Expert ELEX ANNECY mandaté par assurance (04 50 23 57 31 – Pringy)',
      typeEtape: 'VISITE', statutEtape: 'TERMINEE',
      description: '84 route de Vieran, 74371 Pringy Cedex. Mission expertise dégâts des eaux.',
    },
    {
      titre: 'Convocation expertise reçue par Pichet – Grillet demande détails à M. Andujar (17/04/2026)',
      typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE',
      description: 'Pichet découvre le sinistre via convocation ASSURIMO / GROUPAMA. Grillet demande précisions à M. Andujar.',
      dateRealisation: new Date('2026-04-17'),
    },
    {
      titre: 'M. Andujar explique : fuite dans l\'appartement, tuyaux armoire entrée (20/04/2026)',
      typeEtape: 'RELANCE', statutEtape: 'TERMINEE',
      description: 'Fuite sur arrivée/retour eau chaude dans armoire entrée. Plancher soulevé. Assurances personnelle et immeuble à coordonner.',
      dateRealisation: new Date('2026-04-20'),
    },
    {
      titre: 'Pichet (Grillet) transmet à l\'assurance immeuble Assurimo (20/04/2026)',
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

  console.log('✅  Mise à jour partie 2 terminée !')
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
