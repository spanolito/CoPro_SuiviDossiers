import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import styles from './dossier-detail.module.css'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, User, MapPin, Edit, MessageSquare, UploadCloud, Activity } from 'lucide-react'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import DossierActions from './DossierActions'
import DossierStatusControls from './DossierStatusControls'
import StepEditModal from './StepEditModal'
import { getDossierCapabilities } from '@/lib/auth/rbac'
import { requirePermission } from '@/lib/auth/server'

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null
  const isAdmin = payload?.role === 'admin'
  const capabilities = getDossierCapabilities(payload?.role as string)

  const includeParams: Prisma.DossierInclude = {
    responsableCS: true,
    prestatairePrincipal: true,
    syndicImplique: true,
    responsableAction: true,
    coproprietaireConcerne: true,
    zoneCommune: true,
    etapes: { 
      orderBy: { stepDate: 'desc' },
      include: {
        historique: { orderBy: { changedAt: 'desc' }, include: { changedBy: true } }
      }
    },
    documents: { orderBy: { createdAt: 'desc' } },
  }

  if (capabilities.canCommentInternal) {
    includeParams.commentaires = { orderBy: { createdAt: 'desc' }, include: { auteur: true } }
  }

  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: includeParams
  })

  if (!dossier) notFound()

  const activityLogs = await prisma.dossierActivite.findMany({
    where: { dossierId: id },
    orderBy: { createdAt: 'desc' },
    include: { auteur: true }
  })

  const getStatusLabel = (statut: string) => {
    const m: Record<string, string> = {
      ENREGISTRE: 'Enregistré', AFFECTE: 'Affecté', EN_COURS: 'En Cours',
      A_VALIDER: 'À Valider', CLOTURE: 'Clôturé', BLOQUE: 'Bloqué', ARCHIVE: 'Archivé',
    }
    return m[statut] || statut
  }

  async function addEtape(formData: FormData) {
    'use server'
    const titre = formData.get('title') as string
    const status = formData.get('status') as string

    if (titre && status) {
      const payload = await requirePermission('dossier.step.add')

      await prisma.dossierEtape.create({
        data: {
          dossierId: id,
          titre,
          typeEtape: 'AUTRE',
          statutEtape: status as any,
          auteurUserId: payload?.id as string,
          dateRealisation: status === 'TERMINEE' ? new Date() : null,
        }
      })
      await prisma.dossierActivite.create({
        data: { dossierId: id, userId: payload?.id as string, typeAction: 'ETAPE_AJOUTEE', resume: `Étape "${titre}" ajoutée` }
      })
      revalidatePath(`/dossiers/${id}`)
    }
  }

  async function addComment(formData: FormData) {
    'use server'
    const contenu = formData.get('content') as string

    if (contenu) {
      const payload = await requirePermission('dossier.comment.internal')

      if (payload?.id) {
        await prisma.dossierCommentaire.create({
          data: { contenu, auteurUserId: payload.id as string, dossierId: id }
        })
        await prisma.dossierActivite.create({
          data: { dossierId: id, userId: payload.id as string, typeAction: 'COMMENTAIRE_AJOUTE', resume: 'Commentaire ajouté' }
        })
        revalidatePath(`/dossiers/${id}`)
      }
    }
  }

  async function uploadDocument(formData: FormData) {
    'use server'
    const fileName = formData.get('fileName') as string
    const fileUrl = formData.get('fileUrl') as string

    if (fileName && fileUrl) {
      const payload = await requirePermission('dossier.document.add')

      const copro = await prisma.copropriete.findFirst()
      await prisma.document.create({
        data: {
          coproprieteId: copro!.id,
          dossierId: id,
          typeDocument: 'AUTRE',
          titre: fileName,
          nomFichier: fileName,
          mimeType: 'application/octet-stream',
          urlOuPath: fileUrl,
          uploadedById: payload?.id as string,
        }
      })
      await prisma.dossierActivite.create({
        data: { dossierId: id, userId: payload?.id as string, typeAction: 'DOCUMENT_AJOUTE', resume: `Document "${fileName}" ajouté` }
      })
      revalidatePath(`/dossiers/${id}`)
    }
  }

  const getPriorityBadgeClass = (p: string) => {
    switch(p) { case 'CRITIQUE': return 'badge-urgent'; case 'HAUTE': return 'badge-high'; case 'MOYENNE': return 'badge-normal'; default: return 'badge-low'; }
  }

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className={styles.headerActions}>
        <div className={styles.titleArea}>
          <Link href="/dossiers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            <ArrowLeft size={16} /> Retour à la liste
          </Link>
          <h1>{dossier.titre}</h1>
          <div className={styles.badges}>
            <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{dossier.reference}</span>
            <span className={`badge ${getPriorityBadgeClass(dossier.priorite)}`}>Priorité {dossier.priorite}</span>
            <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>{getStatusLabel(dossier.statut)}</span>
          </div>
        </div>
        {capabilities.canEdit && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={`/dossiers/${id}/edit`} className="btn btn-outline"><Edit size={16} /> Éditer</Link>
            <DossierActions
              dossierId={id}
              isAdmin={isAdmin}
              isArchived={dossier.archived}
              counts={{ etapes: dossier.etapes.length, commentaires: dossier.commentaires.length, documents: dossier.documents.length }}
            />
          </div>
        )}
      </div>

      {capabilities.canAdvance && (
        <DossierStatusControls
          dossierId={id}
          currentStatus={dossier.statut}
          isAdmin={isAdmin}
          hasResponsables={!!dossier.responsableCSId}
          finalDecision={dossier.finalDecision}
        />
      )}

      <div className={styles.container}>
        <div className={styles.mainColumn}>
          <div className="card">
            <h2 className={styles.cardTitle}>Informations Générales</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Type de dossier</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} color="var(--text-secondary)" /> {dossier.typeDossier}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Localisation</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} color="var(--text-secondary)" />
                  {dossier.zoneCommune?.nom || dossier.precisionLocalisation || 'Non spécifiée'}
                  {dossier.precisionLocalisation && dossier.zoneCommune ? ` – ${dossier.precisionLocalisation}` : ''}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Date de création</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} color="var(--text-secondary)" /> {formatDate(dossier.createdAt)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Responsable CS</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} color="var(--text-secondary)" /> {dossier.responsableCS?.nomAffiche || 'Non assigné'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Prestataire / Intervenant</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} color="var(--text-secondary)" />
                  {dossier.prestatairePrincipal?.nom || dossier.responsableAction?.nom || 'Non assigné'}
                </span>
              </div>
              {dossier.syndicImplique && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Syndic impliqué</span>
                  <span className={styles.infoValue}>{dossier.syndicImplique.nom}</span>
                </div>
              )}
              {dossier.coproprietaireConcerne && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Copropriétaire concerné</span>
                  <span className={styles.infoValue}>{dossier.coproprietaireConcerne.prenom} {dossier.coproprietaireConcerne.nom}</span>
                </div>
              )}
            </div>

            <div className={styles.description}>
              <strong>Description :</strong><br />
              {dossier.description}
            </div>
          </div>

          {/* Étapes */}
          <div className="card">
            <h2 className={styles.cardTitle}>Chronologie des étapes</h2>
            {dossier.etapes.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Aucune étape enregistrée.</p> : (
              <div className={styles.timeline}>
                {dossier.etapes.map((etape: any) => (
                  <div key={etape.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineTitle}>
                          {etape.titre}
                          {etape.correctedAt && (
                            <span title={`Corrigé le ${formatDate(etape.correctedAt)} par ${etape.historique?.[0]?.changedBy?.nomAffiche}. Motif: ${etape.correctionReason}`} style={{ marginLeft: 8, fontSize: 11, background: '#FFF3CD', color: '#856404', padding: '2px 6px', borderRadius: 4, cursor: 'help' }}>
                              Date modifiée
                            </span>
                          )}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className={styles.timelineDate}>{formatDate(etape.stepDate)}</span>
                          {capabilities.canEdit && (
                            <StepEditModal 
                              dossierId={id} 
                              etapeId={etape.id} 
                              currentTitle={etape.titre} 
                              currentDate={etape.stepDate} 
                              currentReason={etape.correctionReason} 
                            />
                          )}
                        </div>
                      </div>
                      {etape.description && <div className={styles.timelineComment}>{etape.description}</div>}
                      <span className="badge badge-normal" style={{ marginTop: 8 }}>{etape.statutEtape}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {capabilities.canAddStep && (
              <form action={addEtape} style={{ marginTop: 24, padding: 16, background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>Ajouter une étape</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <input type="text" name="title" placeholder="Titre (ex: Devis reçu)" className="form-control" style={{ flex: 1 }} required />
                  <select name="status" className="form-control" required>
                    <option value="TERMINEE">Terminée</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="BLOQUEE">Bloquée</option>
                    <option value="A_FAIRE">À faire</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </form>
            )}
          </div>

          {/* Commentaires */}
          {capabilities.canCommentInternal && (
            <div className="card">
              <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} /> Commentaires internes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {(dossier.commentaires || []).map((c: any) => (
                  <div key={c.id} style={{ background: 'var(--bg-color)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.auteur.nomAffiche}</strong> <span>{formatDate(c.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 14 }}>{c.contenu}</div>
                  </div>
                ))}
                {(!dossier.commentaires || dossier.commentaires.length === 0) && <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Aucun commentaire.</span>}
              </div>

              <form action={addComment} style={{ display: 'flex', gap: 12 }}>
                <input type="text" name="content" className="form-control" placeholder="Ajouter une note interne..." required style={{ flex: 1 }} />
                <button type="submit" className="btn btn-outline">Envoyer</button>
              </form>
            </div>
          )}
        </div>

        {/* Colonne Latérale */}
        <div className={styles.sideColumn}>
          <div className="card">
            <h2 className={styles.cardTitle}>Documents Joints</h2>
            <div style={{ marginBottom: 16 }}>
              {dossier.documents.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Aucun document.</p> : (
                dossier.documents.map((doc: any) => (
                  <div key={doc.id} className={styles.documentItem}>
                    <FileText className={styles.documentIcon} size={24} />
                    <div className={styles.documentName}>{doc.titre}</div>
                    <a href={doc.urlOuPath} target="_blank" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Ouvrir</a>
                  </div>
                ))
              )}
            </div>

            {capabilities.canAddDocument && (
              <form action={uploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-color)', alignItems: 'center' }}>
                <UploadCloud size={24} color="var(--text-secondary)" />
                <input type="url" name="fileUrl" className="form-control" placeholder="Lien du document" required style={{ width: '100%', fontSize: 13 }} />
                <input type="text" name="fileName" className="form-control" placeholder="Nom du document" required style={{ width: '100%', fontSize: 13 }} />
                <button type="submit" className="btn btn-outline" style={{ width: '100%', fontSize: 13 }}>Ajouter le lien</button>
              </form>
            )}
          </div>

          <div className="card">
            <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={18} /> Journal d&apos;Activité</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activityLogs.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Aucune activité.</p> : (
                activityLogs.map((log: any) => (
                  <div key={log.id} style={{ fontSize: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.resume}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Par {log.auteur?.nomAffiche || 'Système'} le {formatDate(log.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
