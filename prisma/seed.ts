import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🏗️  Seed – Copropriété L\'Ambassadeur')

  const hash = await bcrypt.hash('password123', 10)

  // ─── 1. Copropriété ───
  const copro = await prisma.copropriete.upsert({
    where: { id: 'copro-ambassadeur' },
    update: {},
    create: {
      id: 'copro-ambassadeur',
      nom: "Résidence L'Ambassadeur",
      adresse: '10 avenue de la République',
      ville: 'Échirolles',
      codePostal: '38130',
    },
  })

  // ─── 2. Bâtiment ───
  const bat = await prisma.batiment.upsert({
    where: { id: 'bat-ambassadeur' },
    update: {},
    create: {
      id: 'bat-ambassadeur',
      coproprieteId: copro.id,
      nom: "L'Ambassadeur",
      code: 'AMB',
    },
  })

  // ─── 3. Niveaux ───
  const niveauxData = [
    { id: 'niv-ss', code: 'SS', nom: 'Sous-sol', ordre: 0 },
    { id: 'niv-rdc', code: 'RDC', nom: 'Rez-de-chaussée', ordre: 1 },
    { id: 'niv-1', code: 'N1', nom: '1er étage', ordre: 2 },
    { id: 'niv-2', code: 'N2', nom: '2e étage', ordre: 3 },
  ]
  for (const n of niveauxData) {
    await prisma.niveau.upsert({
      where: { id: n.id },
      update: {},
      create: { ...n, coproprieteId: copro.id, batimentId: bat.id },
    })
  }

  // ─── 4. Lots (12 appartements) ───
  const lotsData = [
    { numero: '01', niveauId: 'niv-rdc', libelle: 'Appartement 01 – RDC' },
    { numero: '02', niveauId: 'niv-rdc', libelle: 'Appartement 02 – RDC' },
    { numero: '03', niveauId: 'niv-rdc', libelle: 'Appartement 03 – RDC' },
    { numero: '04', niveauId: 'niv-rdc', libelle: 'Appartement 04 – RDC' },
    { numero: '11', niveauId: 'niv-1', libelle: 'Appartement 11 – 1er étage' },
    { numero: '12', niveauId: 'niv-1', libelle: 'Appartement 12 – 1er étage' },
    { numero: '13', niveauId: 'niv-1', libelle: 'Appartement 13 – 1er étage' },
    { numero: '14', niveauId: 'niv-1', libelle: 'Appartement 14 – 1er étage' },
    { numero: '21', niveauId: 'niv-2', libelle: 'Appartement 21 – 2e étage' },
    { numero: '22', niveauId: 'niv-2', libelle: 'Appartement 22 – 2e étage' },
    { numero: '23', niveauId: 'niv-2', libelle: 'Appartement 23 – 2e étage' },
    { numero: '24', niveauId: 'niv-2', libelle: 'Appartement 24 – 2e étage' },
  ]
  const lots: Record<string, string> = {}
  for (const l of lotsData) {
    const lot = await prisma.lot.upsert({
      where: { coproprieteId_numero: { coproprieteId: copro.id, numero: l.numero } },
      update: {},
      create: {
        coproprieteId: copro.id,
        batimentId: bat.id,
        niveauId: l.niveauId,
        numero: l.numero,
        type: 'APPARTEMENT',
        libelle: l.libelle,
      },
    })
    lots[l.numero] = lot.id
  }

  // ─── 5. Zones Communes ───
  const zonesData: Array<{ id: string; type: string; nom: string; niveauId?: string }> = [
    { id: 'zc-garages', type: 'RAMPE_ACCES_GARAGES', nom: 'Garages', niveauId: 'niv-ss' },
    { id: 'zc-caves', type: 'AUTRE', nom: 'Caves', niveauId: 'niv-ss' },
    { id: 'zc-poubelles', type: 'LOCAL_POUBELLES', nom: 'Local poubelles' },
    { id: 'zc-chaufferie', type: 'CHAUFFERIE', nom: 'Chaufferie', niveauId: 'niv-ss' },
    { id: 'zc-vmc', type: 'VMC', nom: 'VMC' },
    { id: 'zc-ascenseur', type: 'ASCENSEUR', nom: 'Ascenseur' },
    { id: 'zc-escalier', type: 'CAGE_ESCALIER', nom: 'Cage d\'escalier' },
    { id: 'zc-facades', type: 'FACADE_NORD', nom: 'Façades' },
    { id: 'zc-toiture', type: 'TOITURE', nom: 'Toiture' },
    { id: 'zc-terrasse', type: 'TERRASSE', nom: 'Terrasse' },
    { id: 'zc-jardin', type: 'JARDIN', nom: 'Jardin' },
    { id: 'zc-rampe', type: 'RAMPE_ACCES_GARAGES', nom: 'Rampe d\'accès garages', niveauId: 'niv-ss' },
    { id: 'zc-reseaux', type: 'RESEAUX_COMMUNS', nom: 'Réseaux communs' },
  ]
  for (const z of zonesData) {
    await prisma.zoneCommune.upsert({
      where: { id: z.id },
      update: {},
      create: {
        id: z.id,
        coproprieteId: copro.id,
        batimentId: bat.id,
        niveauId: z.niveauId || null,
        type: z.type as any,
        nom: z.nom,
      },
    })
  }

  // ─── 6. Utilisateurs ───
  const usersData = [
    { id: 'usr-oscar', email: 'oscar@copro-ambassadeur.fr', nomAffiche: 'Oscar ANDUJAR', prenom: 'Oscar', nom: 'ANDUJAR', role: 'PRESIDENT_CS' as const, status: 'ACTIVE' as const },
    { id: 'usr-catia', email: 'catia@copro-ambassadeur.fr', nomAffiche: 'Catia BENI', prenom: 'Catia', nom: 'BENI', role: 'MEMBRE_CS' as const, status: 'ACTIVE' as const },
    { id: 'usr-laury', email: 'laury@copro-ambassadeur.fr', nomAffiche: 'Laury CASTAGNETTI', prenom: 'Laury', nom: 'CASTAGNETTI', role: 'MEMBRE_CS' as const, status: 'ACTIVE' as const },
    { id: 'usr-leonella', email: 'leonella@copro-ambassadeur.fr', nomAffiche: 'Leonella CASTELLANO', prenom: 'Leonella', nom: 'CASTELLANO', role: 'MEMBRE_CS' as const, status: 'ACTIVE' as const },
    { id: 'usr-lionel', email: 'lionel@copro-ambassadeur.fr', nomAffiche: 'Lionel CONFORTO', prenom: 'Lionel', nom: 'CONFORTO', role: 'MEMBRE_CS' as const, status: 'ACTIVE' as const },
    { id: 'usr-guillaume-e', email: 'guillaume.e@copro-ambassadeur.fr', nomAffiche: 'Guillaume ESTOUP', prenom: 'Guillaume', nom: 'ESTOUP', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
    { id: 'usr-marika', email: 'marika@copro-ambassadeur.fr', nomAffiche: 'Marika FLYGAR', prenom: 'Marika', nom: 'FLYGAR', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
    { id: 'usr-guillaume-g', email: 'guillaume.g@copro-ambassadeur.fr', nomAffiche: 'Guillaume GOUTAUDIER', prenom: 'Guillaume', nom: 'GOUTAUDIER', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
    { id: 'usr-christophe', email: 'christophe@copro-ambassadeur.fr', nomAffiche: 'Christophe HERICAULT', prenom: 'Christophe', nom: 'HERICAULT', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
    { id: 'usr-aldric', email: 'aldric@copro-ambassadeur.fr', nomAffiche: 'Aldric MARTIN', prenom: 'Aldric', nom: 'MARTIN', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
    { id: 'usr-jeanlouis', email: 'jeanlouis@copro-ambassadeur.fr', nomAffiche: 'Jean Louis PONCIN', prenom: 'Jean Louis', nom: 'PONCIN', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
    { id: 'usr-aline', email: 'aline@copro-ambassadeur.fr', nomAffiche: 'Aline USANASE', prenom: 'Aline', nom: 'USANASE', role: 'COPROPRIETAIRE_LECTURE' as const, status: 'ACTIVE' as const },
  ]
  for (const u of usersData) {
    await prisma.utilisateur.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        coproprieteId: copro.id,
        email: u.email,
        passwordHash: hash,
        nomAffiche: u.nomAffiche,
        prenom: u.prenom,
        nom: u.nom,
        role: u.role,
        status: u.status,
        isActive: true,
      },
    })
  }

  // ─── 7. Copropriétaires (linked to users) ───
  const coproprietairesData = usersData.map(u => ({
    id: `cp-${u.id.replace('usr-', '')}`,
    prenom: u.prenom!,
    nom: u.nom!,
    email: u.email,
    userId: u.id,
  }))
  for (const c of coproprietairesData) {
    await prisma.coproprietaire.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        coproprieteId: copro.id,
        prenom: c.prenom,
        nom: c.nom,
        email: c.email,
        userId: c.userId,
        actif: true,
      },
    })
  }

  // ─── 8. Intervenants ───
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
    // Garder les anciens éléments référencés dans les dossiers
    { id: 'int-volfeu', nom: 'VOLFEU', type: 'PRESTATAIRE' as const, sousType: 'Sécurité / Caméras' },
    { id: 'int-gex', nom: 'GEX MULTISERVICES', type: 'PRESTATAIRE' as const, sousType: 'Travaux + Espaces verts' },
    { id: 'int-walterre', nom: 'WALTERRE', type: 'EXPERT' as const, sousType: 'Audit chaufferie' },
    { id: 'int-chazelle', nom: 'Cabinet CHAZELLE / Me GEOFFRAY', type: 'AVOCAT' as const, sousType: 'Dossier FONCIA' },
    { id: 'int-persea', nom: 'Cabinet PERSEA', type: 'AVOCAT' as const, sousType: 'Contentieux' },
    // Nouveaux intervenants – avril 2026
    { id: 'int-gcclaims', nom: 'GCCLAIMS', type: 'PRESTATAIRE' as const, sousType: 'Électricité / Éclairage', contactPrincipal: 'Marc Niedziela', email: 'mniedziela@gcclaims.fr', contactRole: 'TECHNICIAN', notes: 'Dévis capteur crépusculaire façade (ref. OSTW397910)' },
    { id: 'int-lpe', nom: 'SARL LPE', type: 'PRESTATAIRE' as const, sousType: 'Étanchéité / Toiture', adresse: '125 Route des Creuses, 74650 Chavanod', contactPrincipal: 'Pierre-Emmanuel Labeaune', email: 'contact@sarl-lpe.fr', contactRole: 'TECHNICIAN', notes: 'Intervention toiture appartement Beni – test fumigène 02/04/2026' },
    { id: 'int-groupama', nom: 'Groupama Grand Est', type: 'ASSURANCE' as const, sousType: 'Assurance personnelle', contactRole: 'GENERAL', notes: 'Assurance personnelle M. Andujar – contrat 73078057D-230 – sinistre ref. 2026012366' },
    { id: 'int-elex', nom: 'ELEX ANNECY', type: 'EXPERT' as const, sousType: 'Expertise dégâts des eaux', adresse: '84 route de Vieran, 74371 Pringy Cedex', telephone: '0450235731', contactRole: 'EXPERT', notes: 'Expert mandaté sinistre DDE appartement Andujar' },
    { id: 'int-hydrosolutions', nom: 'HydroSolutions', type: 'PRESTATAIRE' as const, sousType: 'Recherche de fuite', contactRole: 'TECHNICIAN', notes: 'Recherche de fuite' },
  ]
  for (const i of intervenantsData) {
    await prisma.intervenant.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        coproprieteId: copro.id,
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
  }

  // ─── 9. 12 Dossiers réels ───
  const oscar = 'usr-oscar'
  const catia = 'usr-catia'
  const laury = 'usr-laury'
  const leonella = 'usr-leonella'
  const lionel = 'usr-lionel'

  const dossiersData = [
    {
      id: 'dos-01', reference: 'DOS-2025-0001',
      titre: 'Infiltration garage Mme Usanase',
      description: 'Infiltration garage, sinistre déclaré, expert mandaté, devis envoyé, attente retour assurance copropriété.',
      typeDossier: 'SINISTRE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      coproprietaireConcerneId: 'cp-aline',
      zoneCommuneId: 'zc-garages',
      typeLocalisation: 'SOUS_SOL_GARAGE' as const,
    },
    {
      id: 'dos-02', reference: 'DOS-2025-0002',
      titre: 'Infiltrations caves – recherche de fuite',
      description: 'Recherches en cours, suspicion d\'origine appartement Poncin, origine non confirmée.',
      typeDossier: 'SINISTRE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      zoneCommuneId: 'zc-caves',
      typeLocalisation: 'SOUS_SOL_GARAGE' as const,
    },
    {
      id: 'dos-03', reference: 'DOS-2025-0003',
      titre: 'Porte de garage – dysfonctionnement système d\'ouverture',
      description: 'Récepteur HS, courrier au syndic voisin resté sans réponse, sécurité accès garages compromise.',
      typeDossier: 'TECHNIQUE' as const, statut: 'BLOQUE' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      zoneCommuneId: 'zc-rampe',
      typeLocalisation: 'SOUS_SOL_GARAGE' as const,
    },
    {
      id: 'dos-04', reference: 'DOS-2025-0004',
      titre: 'Fuite chauffage au sol – retour 2e étage',
      description: 'Devis validé, intervention à planifier avec coupure temporaire d\'eau.',
      typeDossier: 'CHAUFFAGE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: catia, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      niveauId: 'niv-2',
      typeLocalisation: 'APPARTEMENT_PRIVATIF' as const,
      typeInstallation: 'Chauffage au sol – retour',
    },
    {
      id: 'dos-05', reference: 'DOS-2025-0005',
      titre: 'VMC – dysfonctionnement dans plusieurs appartements',
      description: 'Intervention attendue, plusieurs appartements signalés.',
      typeDossier: 'TECHNIQUE' as const, statut: 'AFFECTE' as const, priorite: 'MOYENNE' as const,
      responsableCSId: laury, createurUserId: oscar,
      zoneCommuneId: 'zc-vmc',
      typeLocalisation: 'EQUIPEMENT_TECHNIQUE' as const,
    },
    {
      id: 'dos-06', reference: 'DOS-2025-0006',
      titre: 'Fuite – local à ordures',
      description: 'Recherche origine fuite, passage de prestataire, attente retour.',
      typeDossier: 'TECHNIQUE' as const, statut: 'EN_COURS' as const, priorite: 'MOYENNE' as const,
      responsableCSId: leonella, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      zoneCommuneId: 'zc-poubelles',
      typeLocalisation: 'PARTIE_COMMUNE' as const,
    },
    {
      id: 'dos-07', reference: 'DOS-2025-0007',
      titre: 'Caméras de surveillance',
      description: 'Projet présenté en AG, problématique CNIL / voie de passage, décision de ne pas donner suite à ce stade.',
      typeDossier: 'SECURITE' as const, statut: 'ARCHIVE' as const, priorite: 'BASSE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      prestatairePrincipalId: 'int-volfeu',
      archived: true, archivedAt: new Date('2025-01-15'),
    },
    {
      id: 'dos-08', reference: 'DOS-2025-0008',
      titre: 'Éclairage de façade',
      description: 'Problème initial résolu, étude capteur crépusculaire / devis demandé.',
      typeDossier: 'TECHNIQUE' as const, statut: 'EN_COURS' as const, priorite: 'BASSE' as const,
      responsableCSId: lionel, createurUserId: oscar,
      zoneCommuneId: 'zc-facades',
      typeLocalisation: 'EXTERIEUR' as const,
    },
    {
      id: 'dos-09', reference: 'DOS-2025-0009',
      titre: 'Chaufferie – dysfonctionnements eau chaude / pompe',
      description: 'Plusieurs interventions, pompe identifiée, commande en cours, remplacement lié au contrat P3.',
      typeDossier: 'CHAUFFAGE' as const, statut: 'EN_COURS' as const, priorite: 'CRITIQUE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      prestatairePrincipalId: 'int-engie',
      responsableActionId: 'int-engie',
      zoneCommuneId: 'zc-chaufferie',
      typeLocalisation: 'EQUIPEMENT_TECHNIQUE' as const,
      typeInstallation: 'Chaudière collective gaz',
      contratMaintenance: 'Contrat P3 ENGIE',
    },
    {
      id: 'dos-10', reference: 'DOS-2025-0010',
      titre: 'Chaufferie – rapport Walterre / plan d\'action',
      description: 'Chaudière surdimensionnée, besoin de plan d\'action chiffré et priorisé, optimisation demandée.',
      typeDossier: 'CHAUFFAGE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      prestatairePrincipalId: 'int-walterre',
      responsableActionId: 'int-walterre',
      zoneCommuneId: 'zc-chaufferie',
      typeLocalisation: 'EQUIPEMENT_TECHNIQUE' as const,
    },
    {
      id: 'dos-11', reference: 'DOS-2025-0011',
      titre: 'Comptes de copropriété 2024–2025',
      description: 'Comptes non approuvés, questions sur compte d\'attente débiteur, factures non parvenues, travaux, calendrier légal de l\'AG d\'approbation.',
      typeDossier: 'FINANCIER' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      responsableActionId: 'int-pichet',
    },
    {
      id: 'dos-12', reference: 'DOS-2025-0012',
      titre: 'Dossier FONCIA',
      description: 'Récupération de pièces, honoraires amiables de 600 €, aucun projet d\'assignation à ce stade, dossier à suivre.',
      typeDossier: 'JURIDIQUE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-chazelle',
      responsableActionId: 'int-chazelle',
    },
    // ── Nouveaux dossiers – avril 2026 ──
    {
      id: 'dos-13', reference: 'DOS-2026-0013',
      titre: 'Fuite toiture – appartement Mme Beni',
      description: 'Infiltration depuis la toiture constatée (cloques plafond). Altiscience mandatée, LPE intervient le 02/04/2026 (test fumigène, 5 cm eau sous étanchéité, joint réparé). Devis complémentaire LPE validé le 15/04/2026.',
      typeDossier: 'SINISTRE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: catia, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-lpe',
      coproprietaireConcerneId: 'cp-catia',
      zoneCommuneId: 'zc-toiture',
      typeLocalisation: 'TOITURE' as const,
    },
    {
      id: 'dos-14', reference: 'DOS-2026-0014',
      titre: 'Remplacement chaudière collective – horizon 2027',
      description: 'Chaudière surdimensionnée et vieillissante identifiée par le rapport Walterre. Remplacement à planifier à l\'horizon 2027, sujet évoqué en AG 2026, votation des copropriétaires nécessaire.',
      typeDossier: 'CHAUFFAGE' as const, statut: 'EN_COURS' as const, priorite: 'BASSE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-engie',
      zoneCommuneId: 'zc-chaufferie',
      typeLocalisation: 'EQUIPEMENT_TECHNIQUE' as const,
      typeInstallation: 'Chaudière collective gaz',
    },
    {
      id: 'dos-15', reference: 'DOS-2026-0015',
      titre: 'Dégâts des eaux – appartement M. Andujar',
      description: 'Fuite arrivée/retour eau chaude dans l\'armoire d\'entrée le 02/03/2026, plancher soulevé. Sinistre déclaré GROUPAMA (ref. 2026012366). Expert ELEX ANNECY mandaté. Grillet informe assurance immeuble le 20/04/2026. Attente constat DDE et facture suppression cause.',
      typeDossier: 'SINISTRE' as const, statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      responsableCSId: oscar, createurUserId: oscar,
      syndicImpliqueId: 'int-pichet',
      prestatairePrincipalId: 'int-elex',
      responsableActionId: 'int-groupama',
      coproprietaireConcerneId: 'cp-oscar',
      typeLocalisation: 'APPARTEMENT_PRIVATIF' as const,
    },
  ]

  for (const d of dossiersData) {
    await prisma.dossier.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        coproprieteId: copro.id,
        batimentId: bat.id,
        reference: d.reference,
        titre: d.titre,
        description: d.description,
        typeDossier: d.typeDossier,
        statut: d.statut,
        priorite: d.priorite,
        responsableCSId: d.responsableCSId,
        createurUserId: d.createurUserId,
        syndicImpliqueId: d.syndicImpliqueId || null,
        prestatairePrincipalId: d.prestatairePrincipalId || null,
        responsableActionId: d.responsableActionId || null,
        coproprietaireConcerneId: d.coproprietaireConcerneId || null,
        niveauId: d.niveauId || null,
        zoneCommuneId: d.zoneCommuneId || null,
        typeLocalisation: d.typeLocalisation || null,
        typeInstallation: d.typeInstallation || null,
        contratMaintenance: d.contratMaintenance || null,
        archived: d.archived || false,
        archivedAt: d.archivedAt || null,
      },
    })
  }

  // ─── 10. Étapes & Activités par dossier ───
  const etapesParDossier: Array<{
    dossierId: string
    etapes: Array<{ titre: string; typeEtape: string; statutEtape: string; description?: string }>
  }> = [
    {
      dossierId: 'dos-01',
      etapes: [
        { titre: 'Signalement de l\'infiltration', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Sinistre déclaré auprès du syndic', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE' },
        { titre: 'Expert mandaté', typeEtape: 'VISITE', statutEtape: 'TERMINEE' },
        { titre: 'Devis envoyé', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE' },
        { titre: 'Attente retour assurance copropriété', typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE' },
      ],
    },
    {
      dossierId: 'dos-02',
      etapes: [
        { titre: 'Constatation infiltrations dans les caves', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Recherche de fuite lancée', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE' },
        { titre: 'Suspicion origine appt Poncin', typeEtape: 'VISITE', statutEtape: 'EN_ATTENTE', description: 'Origine non confirmée' },
      ],
    },
    {
      dossierId: 'dos-03',
      etapes: [
        { titre: 'Signalement dysfonctionnement ouverture', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Courrier envoyé au syndic voisin', typeEtape: 'RELANCE', statutEtape: 'TERMINEE' },
        { titre: 'Réponse voisin : aucune', typeEtape: 'REPONSE_RECUE', statutEtape: 'BLOQUEE', description: 'Sans réponse depuis 2 mois' },
      ],
    },
    {
      dossierId: 'dos-04',
      etapes: [
        { titre: 'Signalement fuite chauffage au sol', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Devis demandé', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE' },
        { titre: 'Devis validé', typeEtape: 'DEVIS_VALIDE', statutEtape: 'TERMINEE' },
        { titre: 'Intervention à planifier (coupure eau)', typeEtape: 'INTERVENTION_PLANIFIEE', statutEtape: 'A_FAIRE' },
      ],
    },
    {
      dossierId: 'dos-05',
      etapes: [
        { titre: 'Signalement VMC défaillante', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Affecté au prestataire', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE' },
      ],
    },
    {
      dossierId: 'dos-06',
      etapes: [
        { titre: 'Signalement fuite local ordures', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Passage prestataire', typeEtape: 'VISITE', statutEtape: 'TERMINEE' },
        { titre: 'Attente retour diagnostic', typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE' },
      ],
    },
    {
      dossierId: 'dos-07',
      etapes: [
        { titre: 'Projet présenté en AG', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Problématique CNIL identifiée', typeEtape: 'DECISION', statutEtape: 'TERMINEE', description: 'Voie de passage → pas de suite' },
        { titre: 'Dossier archivé', typeEtape: 'CLOTURE', statutEtape: 'TERMINEE' },
      ],
    },
    {
      dossierId: 'dos-08',
      etapes: [
        { titre: 'Signalement éclairage façade HS', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Problème initial résolu', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE' },
        { titre: 'Étude capteur crépusculaire / devis', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'EN_ATTENTE' },
      ],
    },
    {
      dossierId: 'dos-09',
      etapes: [
        { titre: 'Signalement pannes eau chaude', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Intervention ENGIE – diagnostic pompe', typeEtape: 'VISITE', statutEtape: 'TERMINEE' },
        { titre: 'Pompe identifiée, commande pièce', typeEtape: 'DEVIS_VALIDE', statutEtape: 'TERMINEE' },
        { titre: 'Remplacement pompe – contrat P3', typeEtape: 'INTERVENTION_PLANIFIEE', statutEtape: 'A_FAIRE' },
      ],
    },
    {
      dossierId: 'dos-10',
      etapes: [
        { titre: 'Audit chaufferie par Walterre', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Rapport reçu : chaudière surdimensionnée', typeEtape: 'REPONSE_RECUE', statutEtape: 'TERMINEE' },
        { titre: 'Plan d\'action chiffré demandé à ENGIE', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'EN_ATTENTE' },
      ],
    },
    {
      dossierId: 'dos-11',
      etapes: [
        { titre: 'Ouverture dossier comptes 2024-2025', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Questions envoyées au syndic', typeEtape: 'RELANCE', statutEtape: 'TERMINEE', description: 'Compte d\'attente débiteur, factures manquantes' },
        { titre: 'Attente calendrier AG approbation', typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE' },
      ],
    },
    {
      dossierId: 'dos-12',
      etapes: [
        { titre: 'Ouverture dossier FONCIA', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Récupération de pièces en cours', typeEtape: 'AUTRE', statutEtape: 'EN_ATTENTE' },
        { titre: 'Honoraires amiables 600 € – à suivre', typeEtape: 'DECISION', statutEtape: 'EN_ATTENTE', description: 'Aucun projet d\'assignation à ce stade' },
      ],
    },
    // ── Nouveaux dossiers – avril 2026 ──
    {
      dossierId: 'dos-13',
      etapes: [
        { titre: 'Cloques plafond constatées – signalement Mme Beni', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Altiscience mandatée pour recherche fuite toiture', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE' },
        { titre: 'LPE intervient – test fumigène, 5 cm eau sous étanchéité, joint réparé (02/04/2026)', typeEtape: 'INTERVENTION_REALISEE', statutEtape: 'TERMINEE', description: 'Pierre-Emmanuel Labeaune – SARL LPE' },
        { titre: 'Devis complémentaire LPE soumis (09/04/2026)', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'TERMINEE' },
        { titre: 'Devis LPE validé (15/04/2026) – intervention complémentaire à planifier', typeEtape: 'DEVIS_VALIDE', statutEtape: 'EN_ATTENTE' },
      ],
    },
    {
      dossierId: 'dos-14',
      etapes: [
        { titre: 'Diagnostic Walterre – chaudière surdimensionnée et vieillissante identifiée', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Sujet évoqué en AG 2026 – votation nécessaire', typeEtape: 'DECISION', statutEtape: 'TERMINEE' },
        { titre: 'Remplacement planifié à l\'horizon 2027 – devis à obtenir', typeEtape: 'DEVIS_DEMANDE', statutEtape: 'A_FAIRE' },
      ],
    },
    {
      dossierId: 'dos-15',
      etapes: [
        { titre: 'Fuite arrivée/retour eau chaude – armoire entrée, plancher soulevé (02/03/2026)', typeEtape: 'CREATION', statutEtape: 'TERMINEE' },
        { titre: 'Sinistre déclaré assurance personnelle GROUPAMA (ref. 2026012366)', typeEtape: 'AFFECTATION', statutEtape: 'TERMINEE' },
        { titre: 'Expert ELEX ANNECY mandaté', typeEtape: 'VISITE', statutEtape: 'TERMINEE' },
        { titre: 'Grillet (Pichet) informe assurance immeuble (20/04/2026)', typeEtape: 'RELANCE', statutEtape: 'TERMINEE' },
        { titre: 'Attente constat DDE de l\'expert ELEX', typeEtape: 'REPONSE_RECUE', statutEtape: 'EN_ATTENTE' },
        { titre: 'Attente facture de suppression de cause', typeEtape: 'REPONSE_RECUE', statutEtape: 'A_FAIRE' },
      ],
    },
  ]

  for (const group of etapesParDossier) {
    for (const e of group.etapes) {
      await prisma.dossierEtape.create({
        data: {
          dossierId: group.dossierId,
          titre: e.titre,
          description: e.description || null,
          typeEtape: e.typeEtape as any,
          statutEtape: e.statutEtape as any,
          auteurUserId: oscar,
          dateRealisation: e.statutEtape === 'TERMINEE' ? new Date() : null,
        },
      })
    }

    // Activité de création pour chaque dossier
    await prisma.dossierActivite.create({
      data: {
        dossierId: group.dossierId,
        userId: oscar,
        typeAction: 'DOSSIER_CREE',
        resume: 'Dossier créé par le Président du CS',
      },
    })
    await prisma.dossierActivite.create({
      data: {
        dossierId: group.dossierId,
        userId: oscar,
        typeAction: 'STATUT_CHANGE',
        resume: 'Statut mis à jour',
      },
    })
  }

  console.log('✅ Seed terminé avec succès !')
  console.log('   → 1 copropriété, 1 bâtiment, 4 niveaux')
  console.log('   → 12 lots, 13 zones communes')
  console.log('   → 12 utilisateurs (5 CS + 7 copropriétaires)')
  console.log('   → 29 intervenants (dont 5 ajoutés avril 2026)')
  console.log('   → 15 dossiers avec étapes et historique (dont 3 créés avril 2026)')
  console.log('')
  console.log('🔑 Connexion admin : oscar@copro-ambassadeur.fr / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
