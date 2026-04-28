import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // ─── 1. Liste et doublons de dossiers ───
  const dossiers = await prisma.dossier.findMany({
    where: { coproprieteId: 'copro-ambassadeur' },
    select: { id: true, reference: true, titre: true, statut: true },
    orderBy: { reference: 'asc' },
  })

  console.log('\n=== DOSSIERS ===')
  const byRef: Record<string, number> = {}
  const byTitre: Record<string, number> = {}
  for (const d of dossiers) {
    byRef[d.reference] = (byRef[d.reference] || 0) + 1
    byTitre[d.titre] = (byTitre[d.titre] || 0) + 1
    console.log(
      String(d.reference ?? '(null)').padEnd(20),
      String(d.statut ?? '').padEnd(12),
      d.id,
      d.titre,
    )
  }
  const dupRef = Object.entries(byRef).filter(([, v]) => v > 1)
  const dupTitre = Object.entries(byTitre).filter(([, v]) => v > 1)
  console.log(dupRef.length ? `⚠️  DOUBLONS RÉFÉRENCE: ${JSON.stringify(dupRef)}` : '\n✅  Pas de doublons de référence')
  console.log(dupTitre.length ? `⚠️  DOUBLONS TITRE: ${JSON.stringify(dupTitre)}` : '✅  Pas de doublons de titre')

  // ─── 2. Étapes par dossier – doublons et ordre chronologique ───
  console.log('\n=== ÉTAPES PAR DOSSIER ===')
  for (const d of dossiers) {
    const etapes = await prisma.dossierEtape.findMany({
      where: { dossierId: d.id },
      select: { id: true, titre: true, typeEtape: true, statutEtape: true, dateRealisation: true, createdAt: true },
      orderBy: [{ dateRealisation: 'asc' }, { createdAt: 'asc' }],
    })
    if (etapes.length === 0) continue

    console.log(`\n--- ${d.reference} | ${d.titre} (${etapes.length} étapes) ---`)
    const etapeTitres: Record<string, number> = {}
    for (const e of etapes) {
      etapeTitres[e.titre] = (etapeTitres[e.titre] || 0) + 1
      const date = e.dateRealisation
        ? e.dateRealisation.toISOString().slice(0, 10)
        : `(créé ${e.createdAt.toISOString().slice(0, 10)})`
      console.log(`  ${date}  [${e.typeEtape}/${e.statutEtape}]  ${e.titre.slice(0, 80)}`)
    }
    const dupEtapes = Object.entries(etapeTitres).filter(([, v]) => v > 1)
    if (dupEtapes.length) console.log(`  ⚠️  DOUBLONS ÉTAPES: ${JSON.stringify(dupEtapes)}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
