import prisma from '@/lib/prisma'
import styles from '../../new/new-dossier.module.css' // Reusing the same CSS
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { StatutDossier } from '../actions'
import LocalisationClient from '@/components/dossiers/LocalisationClient'
import AssignationClient from '@/components/dossiers/AssignationClient'

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
  const prestataires = await prisma.prestataire.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } })

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
    
    const typeDossier = formData.get('typeDossier') as string
    const responsableCSId = formData.get('responsableCSId') as string
    const actionValue = formData.get('actionValue') as string

    let actionUserId: string | null = null
    let prestataireId: string | null = null

    if (actionValue) {
      const [type, id] = actionValue.split(':')
      if (type === 'user') actionUserId = id
      if (type === 'prestataire') prestataireId = id
    }

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
        typeDossier,
        categoryId,
        responsableCSId: responsableCSId || null,
        prestataireId: prestataireId || null,
        actionUserId: actionUserId || null,
        typeInstallation,
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
          <AssignationClient 
            users={users} 
            prestataires={prestataires} 
            initialTypeDossier={dossier.typeDossier || 'Autre'}
            initialResponsableCSId={dossier.responsableCSId || ''}
            initialActionValue={dossier.actionUserId ? `user:${dossier.actionUserId}` : dossier.prestataireId ? `prestataire:${dossier.prestataireId}` : ''}
          />
        </div>

        <h2 className={styles.sectionTitle}>Spécifique Chauffage / Équipements techniques</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="typeInstallation">Type d'installation</label>
            <input type="text" id="typeInstallation" name="typeInstallation" className="form-control" defaultValue={dossier.typeInstallation || ''} />
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
