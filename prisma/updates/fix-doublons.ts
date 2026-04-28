import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function dedupEtapes(dossierId: string, label: string) {
  const etapes = await prisma.dossierEtape.findMany({
    where: { dossierId },
    orderBy: { createdAt: 'asc' },
  })

  // Group by titre
  const grouped: Record<string, typeof etapes> = {}
  for (const e of etapes) {
    if (!grouped[e.titre]) grouped[e.titre] = []
    grouped[e.titre].push(e)
  }

  let deleted = 0
  for (const [titre, group] of Object.entries(grouped)) {
    if (group.length > 1) {
      // Keep the first (oldest createdAt), delete the rest
      const toDelete = group.slice(1).map((e) => e.id)
      await prisma.dossierEtape.deleteMany({ where: { id: { in: toDelete } } })
      console.log(`  [${label}] Suppression de ${toDelete.length} doublon(s) : "${titre.slice(0, 70)}"`)
      deleted += toDelete.length
    }
  }
  if (deleted === 0) console.log(`  [${label}] Aucun doublon`)
  else console.log(`  [${label}] Total supprimé : ${deleted} étape(s)`)
}

async function main() {
  console.log('🧹  Nettoyage des doublons d\'étapes\n')

  await dedupEtapes('cmncrkj0c0001l204jvimve8x', 'DOS-2026-0014 Fuite toiture Beni')

  const dde = await prisma.dossier.findUnique({ where: { reference: 'DOS-2026-0016' } })
  if (dde) await dedupEtapes(dde.id, 'DOS-2026-0016 DDE Andujar')

  console.log('\n✅  Nettoyage terminé')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
