import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  })
  const conseilRole = await prisma.role.upsert({
    where: { name: 'Conseil syndical' },
    update: {},
    create: { name: 'Conseil syndical' },
  })
  const roRole = await prisma.role.upsert({
    where: { name: 'Read-only' },
    update: {},
    create: { name: 'Read-only' },
  })

  // Users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@copro.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'admin@copro.com',
      name: 'Syndic Admin',
      password: hashedPassword,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  })
  
  const conseilUser = await prisma.user.upsert({
    where: { email: 'conseil@copro.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'conseil@copro.com',
      name: 'Membre du Conseil',
      password: hashedPassword,
      roleId: conseilRole.id,
      status: 'ACTIVE',
    },
  })

  // Categories
  const catInfiltration = await prisma.category.upsert({ where: { name: 'Infiltration / Dégâts' }, update: {}, create: { name: 'Infiltration / Dégâts' } })
  const catChauffage = await prisma.category.upsert({ where: { name: 'Chauffage / Plomberie' }, update: {}, create: { name: 'Chauffage / Plomberie' } })
  const catElectricite = await prisma.category.upsert({ where: { name: 'Électricité' }, update: {}, create: { name: 'Électricité' } })
  const catToiture = await prisma.category.upsert({ where: { name: 'Toiture / Fissures' }, update: {}, create: { name: 'Toiture / Fissures' } })
  const catLitige = await prisma.category.upsert({ where: { name: 'Litige / Assurance' }, update: {}, create: { name: 'Litige / Assurance' } })
  const catAG = await prisma.category.upsert({ where: { name: 'Décision AG' }, update: {}, create: { name: 'Décision AG' } })
  const catFacade = await prisma.category.upsert({ where: { name: 'Façade' }, update: {}, create: { name: 'Façade' } })

  // Dossiers
  // 1. Infiltration garage
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-001' },
    update: {},
    create: {
      reference: 'DOS-2026-001',
      title: 'Infiltration mur nord du garage',
      description: 'Présence d\'eau signalée par le copropriétaire du lot 42 lors de fortes pluies.',
      statut: 'en_cours',
      priorite: 'haute',
      building: 'Bâtiment A',
      lotZone: 'Sous-sol / Garage',
      categoryId: catInfiltration.id,
      assigneeId: adminUser.id,
      etapes: {
        create: [
          { title: 'Signalement reçu', statut: 'terminée', comment: 'Mail du copropriétaire.', date: new Date('2026-03-01T10:00:00Z') },
          { title: 'Visite effectuée', statut: 'terminée', comment: 'Visite avec le plombier.', date: new Date('2026-03-05T14:00:00Z') }
        ]
      }
    }
  })

  // 2. Fuite toiture
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-002' },
    update: {},
    create: {
      reference: 'DOS-2026-002',
      title: 'Fuite vérifiée sur toiture principale',
      description: 'L\'expert est passé, la réparation nécessite un devis du couvreur pour l\'AG.',
      statut: 'en_attente_devis',
      priorite: 'urgente',
      building: 'Bâtiment Principal',
      lotZone: 'Toit terrasse',
      categoryId: catToiture.id,
      assigneeId: adminUser.id,
    }
  })

  // 3. Litige assurance
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-003' },
    update: {},
    create: {
      reference: 'DOS-2026-003',
      title: 'Litige assurance dégât des eaux appt 12',
      description: 'L\'assurance refuse la prise en charge de la recherche de fuite.',
      statut: 'bloque',
      priorite: 'moyenne',
      building: 'Bâtiment B',
      lotZone: 'Appartement 12',
      categoryId: catLitige.id,
      assigneeId: conseilUser.id,
    }
  })

  // 4. Façade devis
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-004' },
    update: {},
    create: {
      reference: 'DOS-2026-004',
      title: 'Devis réfection façade',
      description: 'Besoin de 3 devis pour la prochaine AG concernant le ravalement côté rue.',
      statut: 'nouveau',
      priorite: 'basse',
      categoryId: catFacade.id,
      assigneeId: adminUser.id,
    }
  })

  // 5. Panne éclairage
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-005' },
    update: {},
    create: {
      reference: 'DOS-2026-005',
      title: 'Panne éclairage couloir 2ème étage',
      description: 'Tout le couloir est dans le noir.',
      statut: 'resolu',
      priorite: 'haute',
      building: 'Bâtiment A',
      lotZone: '2ème Étage',
      categoryId: catElectricite.id,
      etapes: {
        create: [
          { title: 'Intervention électricien', statut: 'terminée', comment: 'Ampoules et fusible changés.' }
        ]
      }
    }
  })

  // 6. Décision AG
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-006' },
    update: {},
    create: {
      reference: 'DOS-2026-006',
      title: 'Validation devis ascenseur par AG',
      description: 'Mise aux normes décidée à la dernière AG. Attente signature contrat.',
      statut: 'en_attente_syndic',
      priorite: 'moyenne',
      categoryId: catAG.id,
    }
  })

  // 7. Panne chaudière chauffage
  await prisma.dossier.upsert({
    where: { reference: 'DOS-2026-007' },
    update: {},
    create: {
      reference: 'DOS-2026-007',
      title: 'Arrêt de la chaudière collective',
      description: 'Code erreur E42 sur la chaudière principale. Plus d\'eau chaude.',
      statut: 'urgent_intervention',
      priorite: 'urgente',
      categoryId: catChauffage.id,
      assigneeId: adminUser.id,
      typeInstallation: 'Chaudière Gaz',
      prestataire: 'ChauffagePro Services',
      contratMaintenance: 'P2',
      lastMaintenance: new Date('2025-10-15T00:00:00Z'),
      nextDeadline: new Date('2026-10-15T00:00:00Z')
    }
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
