import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dossiers = await prisma.dossier.findMany();
  for (const d of dossiers) {
    let s = d.statut.toLowerCase();
    let newStatus = 'ENREGISTRE';

    if (s === 'nouveau' || s === 'nouveau') newStatus = 'ENREGISTRE';
    else if (s === 'en_cours' || s === 'urgent_intervention' || s === 'en_suivi') newStatus = 'EN_COURS';
    else if (s === 'resolu') newStatus = 'A_VALIDER';
    else if (s === 'cloture') newStatus = 'CLOTURE';
    else if (s === 'bloque') newStatus = 'BLOQUE';

    if (d.assigneeId && (newStatus === 'ENREGISTRE')) {
      newStatus = 'AFFECTE';
    }

    await prisma.dossier.update({
      where: { id: d.id },
      data: { statut: newStatus }
    });
  }
  console.log('Dossiers successfully mapped to new streamlined statuses.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
