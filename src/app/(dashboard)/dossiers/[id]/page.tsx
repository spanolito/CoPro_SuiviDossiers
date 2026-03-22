import prisma from '@/lib/prisma'
import styles from './dossier-detail.module.css'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, User, MapPin, Edit, CheckCircle, MessageSquare, UploadCloud, Activity } from 'lucide-react'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: {
      category: true,
      assignee: true,
      etapes: { orderBy: { date: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      commentaires: { orderBy: { createdAt: 'desc' }, include: { author: true } }
    }
  })

  if (!dossier) notFound()

  const activityLogs = await prisma.activityLog.findMany({
    where: { targetType: 'Dossier', targetId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })

  // --- SERVER ACTIONS ---

  async function addEtape(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const status = formData.get('status') as string
    const comment = formData.get('comment') as string
    
    if (title && status) {
      await prisma.etape.create({ data: { title, statut: status, comment, dossierId: id } })
      await prisma.activityLog.create({ data: { action: 'ADDED_ETAPE', targetType: 'Dossier', targetId: id }})
      revalidatePath(`/dossiers/${id}`)
    }
  }

  async function addComment(formData: FormData) {
    'use server'
    const content = formData.get('content') as string
    
    if (content) {
      // Pour la démo, on assigne au premier admin
      const admin = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } })
      if(admin) {
        await prisma.commentaire.create({ data: { content, authorId: admin.id, dossierId: id } })
        await prisma.activityLog.create({ data: { action: 'ADDED_COMMENT', targetType: 'Dossier', targetId: id, userId: admin.id }})
        revalidatePath(`/dossiers/${id}`)
      }
    }
  }

  async function uploadDocument(formData: FormData) {
    'use server'
    const fileName = formData.get('fileName') as string
    
    if (fileName) {
      // Simulation of upload saving
      await prisma.document.create({ data: { name: fileName, type: 'PDF', url: '/uploads/mock.pdf', dossierId: id } })
      await prisma.activityLog.create({ data: { action: 'UPLOADED_DOCUMENT', targetType: 'Dossier', targetId: id }})
      revalidatePath(`/dossiers/${id}`)
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'urgente': return 'badge-urgent'
      case 'haute': return 'badge-high'
      case 'moyenne': return 'badge-normal'
      default: return 'badge-low'
    }
  }

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className={styles.headerActions}>
        <div className={styles.titleArea}>
          <Link href="/dossiers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            <ArrowLeft size={16} /> Retour à la liste
          </Link>
          <h1>{dossier.title}</h1>
          <div className={styles.badges}>
            <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{dossier.reference}</span>
            <span className={`badge ${getPriorityBadgeClass(dossier.priorite)}`}>Priorité {dossier.priorite}</span>
            <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>Statut: {dossier.statut}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href={`/dossiers/${id}/edit`} className="btn btn-outline"><Edit size={16} /> Éditer</Link>
          <button className="btn btn-primary"><CheckCircle size={16} /> Résoudre</button>
        </div>
      </div>

      <div className={styles.container}>
        {/* Colonne Principale */}
        <div className={styles.mainColumn}>
          <div className="card">
            <h2 className={styles.cardTitle}>Informations Générales</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Catégorie</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} color="var(--text-secondary)" /> {dossier.category.name}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Localisation</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} color="var(--text-secondary)" /> {dossier.building} {dossier.lotZone ? `- ${dossier.lotZone}` : ''}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Date de création</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} color="var(--text-secondary)" /> {formatDate(dossier.createdAt)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Responsable</span>
                <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} color="var(--text-secondary)" /> {dossier.assignee?.name || 'Non assigné'}
                </span>
              </div>
            </div>
            
            <div className={styles.description}>
              <strong>Description de l'incident :</strong><br />
              {dossier.description}
            </div>
          </div>

          {/* Champs Spécifiques Chauffage */}
          {(dossier.typeInstallation || dossier.prestataire) && (
            <div className="card">
              <h2 className={styles.cardTitle}>Informations Spécifiques (Équipements)</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Type d'installation</span><span className={styles.infoValue}>{dossier.typeInstallation || '-'}</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Prestataire de maintenance</span><span className={styles.infoValue}>{dossier.prestataire || '-'}</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Contrat de maintenance</span><span className={styles.infoValue}>{dossier.contratMaintenance || '-'}</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Prochaine échéance</span><span className={styles.infoValue} style={{ color: 'var(--danger)', fontWeight: 600 }}>{dossier.nextDeadline ? formatDate(dossier.nextDeadline) : '-'}</span></div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className={styles.cardTitle}>Chronologie des étapes</h2>
            {dossier.etapes.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Aucune étape enregistrée.</p> : (
              <div className={styles.timeline}>
                {dossier.etapes.map((etape) => (
                  <div key={etape.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineTitle}>{etape.title}</span>
                        <span className={styles.timelineDate}>{formatDate(etape.date)}</span>
                      </div>
                      {etape.comment && <div className={styles.timelineComment}>{etape.comment}</div>}
                      <span className="badge badge-normal" style={{ marginTop: 8 }}>{etape.statut}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <form action={addEtape} style={{ marginTop: 24, padding: 16, background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>Ajouter une étape</h3>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <input type="text" name="title" placeholder="Titre (ex: Devis reçu)" className="form-control" style={{ flex: 1 }} required />
                <select name="status" className="form-control" required>
                  <option value="terminée">Terminée</option>
                  <option value="en_attente">En attente</option>
                  <option value="bloquée">Bloquée</option>
                </select>
              </div>
              <textarea name="comment" className="form-control" placeholder="Commentaire optionnel..." style={{ width: '100%', marginBottom: 12, resize: 'vertical' }}></textarea>
              <button type="submit" className="btn btn-primary">Ajouter</button>
            </form>
          </div>
          
          <div className="card">
            <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} /> Commentaires internes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {dossier.commentaires.map((c) => (
                <div key={c.id} style={{ background: 'var(--bg-color)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{c.author.name}</strong> <span>{formatDate(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 14 }}>{c.content}</div>
                </div>
              ))}
              {dossier.commentaires.length === 0 && <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Aucun commentaire.</span>}
            </div>

            <form action={addComment} style={{ display: 'flex', gap: 12 }}>
              <input type="text" name="content" className="form-control" placeholder="Ajouter une note interne..." required style={{ flex: 1 }} />
              <button type="submit" className="btn btn-outline">Envoyer</button>
            </form>
          </div>
        </div>

        {/* Colonne Latérale */}
        <div className={styles.sideColumn}>
          <div className="card">
            <h2 className={styles.cardTitle}>Documents Joints</h2>
            <div style={{ marginBottom: 16 }}>
              {dossier.documents.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Aucun document.</p> : (
                dossier.documents.map((doc) => (
                  <div key={doc.id} className={styles.documentItem}>
                    <FileText className={styles.documentIcon} size={24} />
                    <div className={styles.documentName}>{doc.name}</div>
                    <a href={doc.url} target="_blank" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Ouvrir</a>
                  </div>
                ))
              )}
            </div>
            
            {/* Fake Upload Form */}
            <form action={uploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-color)', alignItems: 'center' }}>
              <UploadCloud size={24} color="var(--text-secondary)" />
              <input type="text" name="fileName" className="form-control" placeholder="Nom du document mock" required style={{ width: '100%', fontSize: 12 }} />
              <button type="submit" className="btn btn-outline" style={{ width: '100%', fontSize: 12 }}>Simuler l'Upload</button>
            </form>
          </div>

          <div className="card">
            <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={18} /> Journal d'Activité</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activityLogs.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Aucune activité.</p> : (
                activityLogs.map((log) => (
                  <div key={log.id} style={{ fontSize: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Par {log.user?.name || 'Système'} le {formatDate(log.createdAt)}</div>
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
