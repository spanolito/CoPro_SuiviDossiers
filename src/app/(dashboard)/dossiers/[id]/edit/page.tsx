import prisma from '@/lib/prisma'
import type { Intervenant, PrioriteDossier, StatutDossier, TypeDossier, Utilisateur, ZoneCommune, Prisma } from '@prisma/client'
import styles from '../../dossiers.module.css'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ALLOWED_TRANSITIONS, PRIORITY_LABELS, STATUT_LABELS, getStatusLabel, normalizeDossierStatus } from '@/lib/dossier-constants'
import { hasPermission } from '@/lib/auth/rbac'
import { requirePermission } from '@/lib/auth/server'
import { notifyDossierStakeholders, recordDossierEvent } from '@/lib/dossier-tracking'
import { logActivity } from '@/lib/activity-log'

export default async function EditDossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const mode = (await searchParams).mode

  const { cookies } = await import('next/headers')
  const { verifyToken } = await import('@/lib/auth')
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!hasPermission(payload?.role as string, 'dossier.update')) {
    redirect(`/dossiers/${id}`)
  }

  const isHistoryOverride = mode === 'admin' && hasPermission(payload?.role as string, 'dossier.history.override')

  const dossier = await prisma.dossier.findUnique({ where: { id } })
  if (!dossier) notFound()

  const users = await prisma.utilisateur.findMany({ where: { role: { in: ['PRESIDENT_CS', 'MEMBRE_CS'] }, isActive: true }, select: { id: true, nomAffiche: true } })
  const intervenants = await prisma.intervenant.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } })
  const zonesCommunes = await prisma.zoneCommune.findMany({ orderBy: { nom: 'asc' } })

  async function updateDossier(formData: FormData) {
    'use server'
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string
    const typeDossier = formData.get('typeDossier') as string
    const priorite = formData.get('priorite') as string
    const responsableCSId = formData.get('responsableCSId') as string
    const assignedToId = formData.get('assignedToId') as string
    const prestatairePrincipalId = formData.get('prestatairePrincipalId') as string
    const syndicImpliqueId = formData.get('syndicImpliqueId') as string
    const zoneCommuneId = formData.get('zoneCommuneId') as string
    const precisionLocalisation = formData.get('precisionLocalisation') as string
    const statut = formData.get('statut') as string

    const payload = await requirePermission('dossier.update')
    const dossier = await prisma.dossier.findUnique({ where: { id } })
    if (!dossier) throw new Error('Dossier introuvable')

    const currentStatus = normalizeDossierStatus(dossier.statut)
    const nextStatus = normalizeDossierStatus(statut || dossier.statut)
    const nextAssignedToId = assignedToId || responsableCSId || null

    const updateData: Prisma.DossierUncheckedUpdateInput = {
      titre,
      description,
      typeDossier: typeDossier as TypeDossier,
      priorite: priorite as PrioriteDossier,
      responsableCSId: responsableCSId || undefined,
      assignedToId: nextAssignedToId,
      prestatairePrincipalId: prestatairePrincipalId || null,
      syndicImpliqueId: syndicImpliqueId || null,
      zoneCommuneId: zoneCommuneId || null,
      precisionLocalisation: precisionLocalisation || null,
      dateDerniereAction: new Date(),
    }

    if (isHistoryOverride) {
      const createdAtStr = formData.get('createdAt') as string
      const createurUserId = formData.get('createurUserId') as string

      if (createdAtStr) {
        const newDate = new Date(createdAtStr)
        if (Math.abs(newDate.getTime() - dossier.createdAt.getTime()) > 1000) {
          updateData.createdAt = newDate
          await logActivity({
            userId: payload?.id as string,
            action: 'HISTORY_OVERRIDE_DATE',
            entity: 'DOSSIER',
            entityId: id,
            metadata: { oldDate: dossier.createdAt.toISOString(), newDate: newDate.toISOString() }
          })
          await logActivity({
            userId: payload?.id as string,
            action: 'HISTORY_OVERRIDE_DATE',
            entity: 'DOSSIER',
            entityId: id,
            metadata: { oldDate: dossier.createdAt, newDate },
          })
        }
      }

      if (createurUserId && createurUserId !== dossier.createurUserId) {
        updateData.createurUserId = createurUserId
        await logActivity({
          userId: payload?.id as string,
          action: 'HISTORY_OVERRIDE_CREATOR',
          entity: 'DOSSIER',
          entityId: id,
          metadata: { oldCreator: dossier.createurUserId, newCreator: createurUserId }
        })
      }
    }

    if (nextStatus !== currentStatus) {
      const allowed = ALLOWED_TRANSITIONS[dossier.statut] || ALLOWED_TRANSITIONS[currentStatus] || []
      if (!allowed.includes(statut) && !allowed.includes(nextStatus)) {
        throw new Error(`Transition de "${getStatusLabel(dossier.statut)}" vers "${getStatusLabel(nextStatus)}" non autorisée.`)
      }
      updateData.statut = nextStatus as StatutDossier
    }

    const updatedDossier = await prisma.dossier.update({
      where: { id },
      data: updateData
    })

    if (nextStatus !== currentStatus) {
      await recordDossierEvent({
        dossierId: id,
        userId: payload.id as string,
        typeAction: 'STATUT_CHANGE',
        resume: `Statut changé vers ${getStatusLabel(nextStatus)} (via édition)`,
        action: 'DOSSIER_STATUS_CHANGED',
        metadata: {
          oldStatus: dossier.statut,
          newStatus: nextStatus,
          source: 'edit-page',
        },
        updateLastAction: false,
      })

      await notifyDossierStakeholders({
        dossier: updatedDossier,
        title: `Statut mis à jour: ${updatedDossier.reference}`,
        message: `Le dossier ${updatedDossier.reference} est maintenant ${getStatusLabel(nextStatus).toLowerCase()}.`,
        type: 'DOSSIER_STATUS_CHANGED',
        link: `/dossiers/${id}`,
      })
    }

    if (dossier.assignedToId !== nextAssignedToId || dossier.responsableCSId !== responsableCSId) {
      await recordDossierEvent({
        dossierId: id,
        userId: payload.id as string,
        typeAction: 'ASSIGNATION_CHANGE',
        resume: 'Assignation du dossier mise à jour',
        action: 'DOSSIER_ASSIGNED',
        metadata: {
          oldAssignedToId: dossier.assignedToId,
          newAssignedToId: nextAssignedToId,
          oldResponsableCSId: dossier.responsableCSId,
          newResponsableCSId: responsableCSId,
        },
        updateLastAction: false,
      })

      await notifyDossierStakeholders({
        dossier: updatedDossier,
        extraUserIds: [nextAssignedToId],
        title: `Dossier assigné: ${updatedDossier.reference}`,
        message: `Le dossier ${updatedDossier.reference} a été réassigné.`,
        type: 'DOSSIER_ASSIGNED',
        link: `/dossiers/${id}`,
      })
    }

    if (
      titre !== dossier.titre ||
      description !== dossier.description ||
      typeDossier !== dossier.typeDossier ||
      priorite !== dossier.priorite ||
      prestatairePrincipalId !== (dossier.prestatairePrincipalId || '') ||
      syndicImpliqueId !== (dossier.syndicImpliqueId || '') ||
      zoneCommuneId !== (dossier.zoneCommuneId || '') ||
      precisionLocalisation !== (dossier.precisionLocalisation || '')
    ) {
      await recordDossierEvent({
        dossierId: id,
        userId: payload.id as string,
        typeAction: 'DOSSIER_MODIFIE',
        resume: 'Informations générales du dossier modifiées',
        action: 'DOSSIER_UPDATED',
        metadata: {
          changedFields: {
            titre: titre !== dossier.titre,
            description: description !== dossier.description,
            typeDossier: typeDossier !== dossier.typeDossier,
            priorite: priorite !== dossier.priorite,
            prestatairePrincipalId: prestatairePrincipalId !== (dossier.prestatairePrincipalId || ''),
            syndicImpliqueId: syndicImpliqueId !== (dossier.syndicImpliqueId || ''),
            zoneCommuneId: zoneCommuneId !== (dossier.zoneCommuneId || ''),
            precisionLocalisation: precisionLocalisation !== (dossier.precisionLocalisation || ''),
          },
        },
        updateLastAction: false,
      })
    }

    if (priorite === 'URGENT' && dossier.priorite !== 'URGENT' && dossier.priorite !== 'CRITIQUE') {
      const { notifyAdminCriticalDossier } = await import('@/lib/utils/notifications')
      await notifyAdminCriticalDossier({ titre, reference: dossier.reference })
    }

    revalidatePath(`/dossiers/${id}`)
    redirect(`/dossiers/${id}`)
  }

  return (
    <div>
      <Link href={`/dossiers/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
        ← Retour au dossier
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Modifier : {dossier.titre}</h1>
        {payload?.role === 'admin' && (
          <Link href={`/dossiers/${id}/edit${isHistoryOverride ? '' : '?mode=admin'}`} className="btn btn-outline" style={{ fontSize: 13, borderColor: isHistoryOverride ? 'var(--danger)' : undefined, color: isHistoryOverride ? 'var(--danger)' : undefined }}>
            {isHistoryOverride ? 'Sortir du Mode Expert' : 'Correction Administrative'}
          </Link>
        )}
      </div>

      {isHistoryOverride && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, color: '#991b1b', fontSize: 14 }}>
          <strong>⚠️ Mode Correction d’Histoire Actif</strong><br />
          Vous modifiez des champs normalement immuables (date de création, créateur). Toute modification sera enregistrée dans le journal d&apos;audit.
        </div>
      )}

      <form action={updateDossier} className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Informations principales</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="titre">Titre *</label>
            <input type="text" id="titre" name="titre" className="form-control" required defaultValue={dossier.titre} />
          </div>
          <div className="form-group">
            <label htmlFor="statut">Statut *</label>
            <select id="statut" name="statut" className="form-control" required defaultValue={dossier.statut}>
              <option value={dossier.statut}>{STATUT_LABELS[dossier.statut] || dossier.statut} (Actuel)</option>
              {(ALLOWED_TRANSITIONS[dossier.statut] || ALLOWED_TRANSITIONS[normalizeDossierStatus(dossier.statut)] || []).map((s: string) => (
                <option key={s} value={s}>{STATUT_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="typeDossier">Type *</label>
            <select id="typeDossier" name="typeDossier" className="form-control" required defaultValue={dossier.typeDossier}>
              <option value="SINISTRE">Sinistre</option>
              <option value="TECHNIQUE">Technique</option>
              <option value="CHAUFFAGE">Chauffage</option>
              <option value="SECURITE">Sécurité</option>
              <option value="TRAVAUX">Travaux</option>
              <option value="ESPACES_VERTS">Espaces verts</option>
              <option value="JURIDIQUE">Juridique</option>
              <option value="FINANCIER">Financier</option>
              <option value="AG">AG</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="priorite">Priorité *</label>
            <select id="priorite" name="priorite" className="form-control" required defaultValue={dossier.priorite}>
              <option value="LOW">{PRIORITY_LABELS.LOW}</option>
              <option value="MEDIUM">{PRIORITY_LABELS.MEDIUM}</option>
              <option value="HIGH">{PRIORITY_LABELS.HIGH}</option>
              <option value="URGENT">{PRIORITY_LABELS.URGENT}</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="description">Description *</label>
            <textarea id="description" name="description" className="form-control" rows={4} required defaultValue={dossier.description} style={{ resize: 'vertical' }} />
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Localisation</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="zoneCommuneId">Zone commune</label>
            <select id="zoneCommuneId" name="zoneCommuneId" className="form-control" defaultValue={dossier.zoneCommuneId || ''}>
              <option value="">Aucune</option>
              {zonesCommunes.map((z: ZoneCommune) => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="precisionLocalisation">Précision</label>
            <input type="text" id="precisionLocalisation" name="precisionLocalisation" className="form-control" defaultValue={dossier.precisionLocalisation || ''} />
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Assignation</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="responsableCSId">Responsable CS *</label>
            <select id="responsableCSId" name="responsableCSId" className="form-control" required defaultValue={dossier.responsableCSId}>
              {users.map((u: Pick<Utilisateur, 'id' | 'nomAffiche'>) => <option key={u.id} value={u.id}>{u.nomAffiche}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assignedToId">Assigné à</label>
            <select id="assignedToId" name="assignedToId" className="form-control" defaultValue={dossier.assignedToId || ''}>
              <option value="">Même responsable que le CS</option>
              {users.map((u: Pick<Utilisateur, 'id' | 'nomAffiche'>) => <option key={u.id} value={u.id}>{u.nomAffiche}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="prestatairePrincipalId">Prestataire</label>
            <select id="prestatairePrincipalId" name="prestatairePrincipalId" className="form-control" defaultValue={dossier.prestatairePrincipalId || ''}>
              <option value="">Aucun</option>
              {intervenants.filter((i: Intervenant) => i.type !== 'SYNDIC').map((i: Intervenant) => <option key={i.id} value={i.id}>{i.nom} ({i.sousType || i.type})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="syndicImpliqueId">Syndic</label>
            <select id="syndicImpliqueId" name="syndicImpliqueId" className="form-control" defaultValue={dossier.syndicImpliqueId || ''}>
              <option value="">Non</option>
              {intervenants.filter((i: Intervenant) => i.type === 'SYNDIC').map((i: Intervenant) => <option key={i.id} value={i.id}>{i.nom}</option>)}
            </select>
          </div>
        </div>

        {isHistoryOverride && (
          <>
            <h2 className={styles.sectionTitle} style={{ marginTop: 32, color: 'var(--danger)' }}>Historique (Administration)</h2>
            <div className={styles.formGrid} style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label htmlFor="createdAt">Date de Création</label>
                <input 
                  type="datetime-local" 
                  id="createdAt" 
                  name="createdAt" 
                  className="form-control" 
                  defaultValue={dossier.createdAt.toISOString().slice(0, 16)} 
                />
              </div>
              <div className="form-group">
                <label htmlFor="createurUserId">Créateur / Auteur</label>
                <select id="createurUserId" name="createurUserId" className="form-control" defaultValue={dossier.createurUserId}>
                  {users.map((u: Pick<Utilisateur, 'id' | 'nomAffiche'>) => <option key={u.id} value={u.id}>{u.nomAffiche}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <Link href={`/dossiers/${dossier.id}`} className="btn btn-outline">Annuler</Link>
          <button type="submit" className="btn btn-primary">Enregistrer les modifications</button>
        </div>
      </form>
    </div>
  )
}
