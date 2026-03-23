import prisma from '@/lib/prisma'
import { notifyAll } from '@/lib/notifications'
import styles from '../dossiers.module.css'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default async function NewDossierPage() {
  const users = await prisma.utilisateur.findMany({ where: { role: { in: ['PRESIDENT_CS', 'MEMBRE_CS'] }, isActive: true }, select: { id: true, nomAffiche: true } })
  const intervenants = await prisma.intervenant.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } })
  const zonesCommunes = await prisma.zoneCommune.findMany({ orderBy: { nom: 'asc' } })

  async function createDossier(formData: FormData) {
    'use server'
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string
    const typeDossier = formData.get('typeDossier') as string
    const priorite = formData.get('priorite') as string
    const responsableCSId = formData.get('responsableCSId') as string
    const prestatairePrincipalId = formData.get('prestatairePrincipalId') as string
    const syndicImpliqueId = formData.get('syndicImpliqueId') as string
    const zoneCommuneId = formData.get('zoneCommuneId') as string
    const precisionLocalisation = formData.get('precisionLocalisation') as string

    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const payload = token ? await verifyToken(token) : null

    const copro = await prisma.copropriete.findFirst()
    if (!copro) throw new Error('Copropriété non trouvée')

    const count = await prisma.dossier.count()
    const reference = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    const newDossier = await prisma.dossier.create({
      data: {
        coproprieteId: copro.id,
        reference,
        titre,
        description,
        typeDossier: typeDossier as any,
        priorite: priorite as any,
        statut: 'ENREGISTRE',
        responsableCSId: responsableCSId || (payload?.id as string),
        createurUserId: payload?.id as string,
        prestatairePrincipalId: prestatairePrincipalId || null,
        syndicImpliqueId: syndicImpliqueId || null,
        zoneCommuneId: zoneCommuneId || null,
        precisionLocalisation: precisionLocalisation || null,
      }
    })

    // Trigger Critical Alert if created with priority CRITIQUE
    if (priorite === 'CRITIQUE') {
      const { notifyAdminCriticalDossier } = await import('@/lib/utils/notifications')
      await notifyAdminCriticalDossier({ titre, reference })
    }


    await prisma.dossierActivite.create({
      data: {
        dossierId: newDossier.id,
        userId: payload?.id as string,
        typeAction: 'DOSSIER_CREE',
        resume: `Dossier "${titre}" créé`,
      }
    })

    await prisma.dossierEtape.create({
      data: {
        dossierId: newDossier.id,
        titre: 'Création du dossier',
        typeEtape: 'CREATION',
        statutEtape: 'TERMINEE',
        auteurUserId: payload?.id as string,
        dateRealisation: new Date(),
      }
    })

    // Notify users
    await notifyAll(
      `Nouveau dossier : ${titre}`,
      `Un nouveau dossier "${titre}" a été ouvert (${reference}).`,
      'DOSSIER_CREE'
    )

    redirect(`/dossiers/${newDossier.id}`)
  }

  return (
    <div>
      <Link href="/dossiers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
        ← Retour à la liste
      </Link>
      <h1>Nouveau Dossier</h1>
      <form action={createDossier} className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Informations principales</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="titre">Titre du dossier *</label>
            <input type="text" id="titre" name="titre" className="form-control" required />
          </div>
          <div className="form-group">
            <label htmlFor="typeDossier">Type de dossier *</label>
            <select id="typeDossier" name="typeDossier" className="form-control" required>
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
            <select id="priorite" name="priorite" className="form-control" required>
              <option value="MOYENNE">Moyenne</option>
              <option value="BASSE">Basse</option>
              <option value="HAUTE">Haute</option>
              <option value="CRITIQUE">Critique</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="description">Description *</label>
            <textarea id="description" name="description" className="form-control" rows={4} required style={{ resize: 'vertical' }} />
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Localisation</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="zoneCommuneId">Zone commune concernée</label>
            <select id="zoneCommuneId" name="zoneCommuneId" className="form-control">
              <option value="">Aucune (lot privatif)</option>
              {zonesCommunes.map((z: any) => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="precisionLocalisation">Précision localisation</label>
            <input type="text" id="precisionLocalisation" name="precisionLocalisation" className="form-control" placeholder="ex: Garage n°3, Cave Mme X..." />
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Assignation</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="responsableCSId">Responsable CS *</label>
            <select id="responsableCSId" name="responsableCSId" className="form-control" required>
              <option value="">Sélectionner</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.nomAffiche}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="prestatairePrincipalId">Prestataire principal</label>
            <select id="prestatairePrincipalId" name="prestatairePrincipalId" className="form-control">
              <option value="">Aucun</option>
              {intervenants.filter((i: any) => i.type !== 'SYNDIC').map((i: any) => <option key={i.id} value={i.id}>{i.nom} ({i.sousType || i.type})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="syndicImpliqueId">Syndic impliqué</label>
            <select id="syndicImpliqueId" name="syndicImpliqueId" className="form-control">
              <option value="">Non</option>
              {intervenants.filter((i: any) => i.type === 'SYNDIC').map((i: any) => <option key={i.id} value={i.id}>{i.nom}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/dossiers" className="btn btn-outline">Annuler</Link>
          <button type="submit" className="btn btn-primary">Créer le dossier</button>
        </div>
      </form>
    </div>
  )
}
