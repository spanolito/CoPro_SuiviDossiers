import prisma from '@/lib/prisma'
import styles from '../../new/new-dossier.module.css' // Reusing the same CSS
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

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

  // Server Action
  async function updateDossier(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const priorite = formData.get('priorite') as string
    const statut = formData.get('statut') as string
    const description = formData.get('description') as string
    const building = formData.get('building') as string
    const lotZone = formData.get('lotZone') as string
    const assigneeId = formData.get('assigneeId') as string
    const typeInstallation = formData.get('typeInstallation') as string
    const prestataire = formData.get('prestataire') as string

    await prisma.dossier.update({
      where: { id },
      data: {
        title,
        description,
        statut,
        priorite,
        building,
        lotZone,
        categoryId,
        assigneeId: assigneeId || null,
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
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="statut">Statut *</label>
            <select id="statut" name="statut" className="form-control" defaultValue={dossier.statut} required>
              <option value="nouveau">Nouveau</option>
              <option value="en_analyse">En Analyse</option>
              <option value="en_attente_devis">Attente Devis</option>
              <option value="en_attente_syndic">Attente Syndic</option>
              <option value="en_cours">En Cours d'intervention</option>
              <option value="urgent_intervention">Urgent</option>
              <option value="en_suivi">En Suivi</option>
              <option value="bloque">Bloqué</option>
              <option value="resolu">Résolu</option>
              <option value="cloture">Clôturé</option>
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
          <div className="form-group">
            <label htmlFor="building">Bâtiment</label>
            <input type="text" id="building" name="building" className="form-control" defaultValue={dossier.building || ''} />
          </div>
          <div className="form-group">
            <label htmlFor="lotZone">Lot / Zone</label>
            <input type="text" id="lotZone" name="lotZone" className="form-control" defaultValue={dossier.lotZone || ''} />
          </div>
          <div className={`form-group ${styles.formGroupFull}`}>
            <label htmlFor="assigneeId">Responsable (assignation)</label>
            <select id="assigneeId" name="assigneeId" className="form-control" defaultValue={dossier.assigneeId || ''}>
              <option value="">Non assigné</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
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
