import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const TYPE_DOSSIER_LABELS: Record<string, string> = {
  SINISTRE: 'Sinistres',
  TECHNIQUE: 'Technique',
  CHAUFFAGE: 'Chauffage',
  SECURITE: 'Sécurité',
  TRAVAUX: 'Travaux',
  ESPACES_VERTS: 'Espaces verts',
  JURIDIQUE: 'Juridique',
  FINANCIER: 'Financier',
  AG: 'AG',
  AUTRE: 'Autre'
}

const STATUT_LABELS: Record<string, string> = {
  ENREGISTRE: 'Enregistré',
  AFFECTE: 'Affecté',
  EN_COURS: 'En Cours',
  A_VALIDER: 'À Valider',
  CLOTURE: 'Clôturé',
  BLOQUE: 'Bloqué',
  ARCHIVE: 'Archivé'
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || !payload.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const rawRole = (payload.role as string) || 'coproprietaire'
  const isAdmin = rawRole === 'admin' || rawRole === 'PRESIDENT_CS'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Accès réservé au Président du Conseil Syndical' }, { status: 403 })
  }

  try {
    const { perimetre = 'dossiers_ouverts', dateDeb, dateFin } = await request.json()

    // 1. Fetch data from Prisma
    const whereClause: any = { archived: false }

    if (perimetre === 'dossiers_ouverts') {
       whereClause.statut = { not: 'CLOTURE' }
    } else if (perimetre === 'activite_sur_periode') {
       // Filter where at least one activity exists in the period
       if (dateDeb && dateFin) {
         whereClause.activites = {
           some: {
             createdAt: {
               gte: new Date(dateDeb),
               lte: new Date(dateFin)
             }
           }
         }
       }
    } else if (perimetre === 'mixte') {
       whereClause.statut = { not: 'CLOTURE' }
    }

    const dossiers = await prisma.dossier.findMany({
      where: whereClause,
      include: {
        responsableCS: true,
        prestatairePrincipal: true,
        syndicImplique: true,
        commentaires: {
          where: isAdmin ? undefined : { interne: false },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        activites: {
          where: dateDeb && dateFin ? {
            createdAt: {
              gte: new Date(dateDeb),
              lte: new Date(dateFin)
            }
          } : undefined,
          orderBy: { createdAt: 'desc' },
          include: { auteur: true }
        },
        etapes: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    // 2. Build Deterministic Markdown Report
    let markdown = `# Compte Rendu d'Activité\n\n`

    // 2a. Introduction
    markdown += `## 1. Introduction\n`
    markdown += `**Période analysée** : ${dateDeb && dateFin ? `Du ${new Date(dateDeb).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}` : 'Toutes les informations disponibles'}\n`
    markdown += `**Périmètre** : ${perimetre === 'dossiers_ouverts' ? 'Tous les dossiers ouverts' : perimetre === 'activite_sur_periode' ? 'Dossiers actifs sur la période' : 'Mixte (Ouverts & Évolution)'}\n`
    markdown += `**Généré par** : Utilisateur (${rawRole})\n\n`

    // 2b. Content by Category
    const categories = Array.from(new Set(dossiers.map(d => d.typeDossier)))
    
    if (dossiers.length === 0) {
      markdown += `*Aucun dossier ne correspond aux critères sélectionnés.*\n\n`
    } else {
      for (const cat of categories) {
        const catDossiers = dossiers.filter(d => d.typeDossier === cat)
        if (catDossiers.length === 0) continue

        markdown += `## 2. ${TYPE_DOSSIER_LABELS[cat] || cat}\n\n`

        for (const d of catDossiers) {
          markdown += `### ${d.titre} (${d.reference})\n`

          // Contextualisation
          const desc = d.description ? d.description.split('\n')[0] : 'Aucune description'
          markdown += `* **Contexte** : ${desc}\n`

          // Actions
          markdown += `* **Actions réalisées** :\n`
          if (d.activites.length === 0) {
             markdown += `  - Aucune action enregistrée sur la période.\n`
          } else {
             d.activites.forEach(a => {
               markdown += `  - ${a.resume} (${new Date(a.createdAt).toLocaleDateString('fr-FR')} par ${a.auteur?.nomAffiche || 'Système'})\n`
             })
          }

          // Situation
          markdown += `* **Situation actuelle** : Statut **${STATUT_LABELS[d.statut] || d.statut}** (Priorité: ${d.priorite})\n`

          // Blockages
          const openEtapes = d.etapes.filter(e => e.statutEtape !== 'TERMINEE')
          if (openEtapes.length > 0) {
             markdown += `* **Points en attente / blocages** :\n`
             openEtapes.forEach(e => {
               markdown += `  - [${e.statutEtape}] ${e.titre}\n`
             })
          } else {
             markdown += `* **Points en attente** : Aucun point bloquant identifié.\n`
          }

          // Comments (Admin only now)
          const publicComments = d.commentaires.filter(c => !c.interne)
          const privateComments = d.commentaires.filter(c => c.interne)
             
          if (publicComments.length > 0) {
             markdown += `* **Commentaires publics** :\n`
             publicComments.slice(0, 2).forEach(c => markdown += `  - ${c.contenu}\n`)
          }
          if (privateComments.length > 0) {
             markdown += `* **Notes internes (Confidentiel)** :\n`
             privateComments.slice(0, 2).forEach(c => markdown += `  - ${c.contenu}\n`)
          }

          markdown += `\n`
        }
      }
    }

    // 2c. Conclusion
    markdown += `## 3. Conclusion\n`
    markdown += `- **Total dossiers** : ${dossiers.length}\n`
    markdown += `- **Dossiers bloqués** : ${dossiers.filter(d => d.statut === 'BLOQUE').length}\n`
    markdown += `- **Dossiers à valider** : ${dossiers.filter(d => d.statut === 'A_VALIDER').length}\n`

    return NextResponse.json({ report: markdown })

  } catch (error: any) {
    console.error('Report Generation Error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du rapport : ' + error.message }, { status: 500 })
  }
}
