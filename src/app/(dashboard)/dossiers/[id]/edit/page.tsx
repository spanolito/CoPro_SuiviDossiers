import prisma from '@/lib/prisma'
import styles from '../../new/new-dossier.module.css' // Reusing the same CSS
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { StatutDossier } from '../actions'
import LocalisationClient from '@/components/dossiers/LocalisationClient'

export default async function EditDossierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const dossier = await prisma.dossier.findUnique({ where: { id } })
  if (!dossier) notFound()
  
  const categories = await prisma.category.findMany()
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const intervenants = await prisma.intervenant.findMany({ orderBy: { nom: 'asc' } })

  // Server Action
  async function updateDossier(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const priorite = formData.get('priorite') as string
    const statut = formData.get('statut') as string
    const validStatuses = Object.values(StatutDossier) as string[]
    if (!validStatuses.includes(statut)) {
      throw new Error('Statut invalide.')
    }
    const description = formData.get('description') as string
    const typeLocalisation = formData.get('typeLocalisation') as string
    const niveau = formData.get('niveau') as string
    const localisation = formData.get('localisation') as string
    const precision = formData.get('precision') as string
    
    const responsableCSId = formData.get('responsableCSId') as string
    const intervenantId = formData.get('intervenantId') as string
    const typeInstallation = formData.get('typeInstallation') as string
    const prestataire = formData.get('prestataire') as string

    await prisma.dossier.update({
      where: { id },
      data: {
        title,
        description,
        statut,
        priorite,
        typeLocalisation,
        niveau,
        localisation,
        precision,
        categoryId,
        responsableCSId: responsableCSId || null,
        intervenantId: intervenantId || null,
        typeInstallation,
        prestataire,
      }
    })

    await prisma.activityLog.create({ data: { action: 'UPDATED_DOSSIER', targetType: 'Dossier', targetId: id }})
    revalidatePath(`/dossiers/${id}`)
    redirect(`/dossiers/${id}`)
  }

  return (
    <div className={styles.formContainer}>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Éditer le dossier {dossier.reference}</h1>

      <form action={updateDossier}>
        <h2 className={styles.sectionTitle}>Informations Générales</h2>
        <div className={styles.formGrid}>
          <div className={`form-group ${styles.formGroupFull}`}>
            <label htmlFor="title">Titre de l'incident *</label>
            <input type="text" id="title" name="title" className="form-control" defaultValue={dossier.title} required />
          </div>
          
          <div className="form-group">
            <label htmlFor="categoryId">Catégorie *</label>
            <select id="categoryId" name="categoryId" className="form-control" defaultValue={dossier.categoryId} required>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="statut">Statut *</label>
            <select id="statut" name="statut" className="form-control" defaultValue={dossier.statut} required>
              <option value="ENREGISTRE">Enregistré</option>
              <option value="AFFECTE">Affecté</option>
              <option value="EN_COURS">En Cours</option>
              <option value="A_VALIDER">À Valider</option>
              <option value="CLOTURE">Clôturé</option>
              <option value="BLOQUE">Bloqué</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priorite">Priorité *</label>
            <select id="priorite" name="priorite" className="form-control" defaultValue={dossier.priorite} required>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div className={`form-group ${styles.formGroupFull}`}>
            <label htmlFor="description">Description détaillée *</label>
            <textarea id="description" name="description" className="form-control" rows={5} defaultValue={dossier.description} required></textarea>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Localisation & Assignation</h2>
        <div className={styles.formGrid}>
          <LocalisationClient 
            initialTypeLoc={dossier.typeLocalisation || ''}
            initialNiveau={dossier.niveau || ''}
            initialLoc={dossier.localisation || ''}
            initialPrecision={dossier.precision || ''}
          />
          <div className="form-group">
            <label htmlFor="responsableCSId">Responsable CS *</label>
            <select id="responsableCSId" name="responsableCSId" className="form-control" defaultValue={dossier.responsableCSId || ''} required>
              <option value="">Sélectionner</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="intervenantId">Responsable de l'action *</label>
            <select id="intervenantId" name="intervenantId" className="form-control" defaultValue={dossier.intervenantId || ''} required>
              <option value="">Sélectionner</option>
              {intervenants.map((i: any) => <option key={i.id} value={i.id}>{i.nom} ({i.type})</option>)}
            </select>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Spécifique Chauffage / Équipements techniques</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="typeInstallation">Type d'installation</label>
            <input type="text" id="typeInstallation" name="typeInstallation" className="form-control" defaultValue={dossier.typeInstallation || ''} />
          </div>
          <div className="form-group">
            <label htmlFor="prestataire">Prestataire associé</label>
            <input type="text" id="prestataire" name="prestataire" className="form-control" defaultValue={dossier.prestataire || ''} />
          </div>
        </div>

        <div className={styles.actions}>
          <Link href={`/dossiers/${dossier.id}`} className="btn btn-outline">Annuler</Link>
          <button type="submit" className="btn btn-primary">Enregistrer les modifications</button>
        </div>
      </form>
    </div>
  )
}
