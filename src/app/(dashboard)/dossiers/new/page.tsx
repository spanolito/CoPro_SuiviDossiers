import prisma from '@/lib/prisma'
import styles from './new-dossier.module.css'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewDossierPage() {
  const categories = await prisma.category.findMany()
  const users = await prisma.user.findMany({ select: { id: true, name: true } })

  // Server Action
  async function createDossier(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const priorite = formData.get('priorite') as string
    const description = formData.get('description') as string
    const building = formData.get('building') as string
    const lotZone = formData.get('lotZone') as string
    const assigneeId = formData.get('assigneeId') as string

    // Heating specific context handled if the category is heating (or regardless to not limit it in this demo)
    const typeInstallation = formData.get('typeInstallation') as string
    const prestataire = formData.get('prestataire') as string

    // Create unique ref DOS-YYYY-XXXX
    const count = await prisma.dossier.count()
    const ref = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const newDossier = await prisma.dossier.create({
      data: {
        reference: ref,
        title,
        description,
        statut: 'nouveau',
        priorite,
        building,
        lotZone,
        categoryId,
        assigneeId: assigneeId || null,
        typeInstallation,
        prestataire,
      }
    })

    redirect(`/dossiers/${newDossier.id}`)
  }

  return (
    <div className={styles.formContainer}>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Créer un nouveau dossier</h1>

      <form action={createDossier}>
        <h2 className={styles.sectionTitle}>Informations Générales</h2>
        <div className={styles.formGrid}>
          <div className={`form-group ${styles.formGroupFull}`}>
            <label htmlFor="title">Titre de l'incident *</label>
            <input type="text" id="title" name="title" className="form-control" required />
          </div>
          
          <div className="form-group">
            <label htmlFor="categoryId">Catégorie *</label>
            <select id="categoryId" name="categoryId" className="form-control" required>
              <option value="">Sélectionner une catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="priorite">Priorité *</label>
            <select id="priorite" name="priorite" className="form-control" required>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div className={`form-group ${styles.formGroupFull}`}>
            <label htmlFor="description">Description détaillée *</label>
            <textarea id="description" name="description" className="form-control" rows={5} required></textarea>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Localisation & Assignation</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="building">Bâtiment</label>
            <input type="text" id="building" name="building" className="form-control" placeholder="ex: Bâtiment A" />
          </div>
          <div className="form-group">
            <label htmlFor="lotZone">Lot / Zone</label>
            <input type="text" id="lotZone" name="lotZone" className="form-control" placeholder="ex: 3ème étage, parking" />
          </div>
          <div className={`form-group ${styles.formGroupFull}`}>
            <label htmlFor="assigneeId">Responsable (assignation)</label>
            <select id="assigneeId" name="assigneeId" className="form-control">
              <option value="">Non assigné</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Spécifique Chauffage / Équipements techniques</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="typeInstallation">Type d'installation</label>
            <input type="text" id="typeInstallation" name="typeInstallation" className="form-control" placeholder="ex: Chaudière Gaz, PAC" />
          </div>
          <div className="form-group">
            <label htmlFor="prestataire">Prestataire associé</label>
            <input type="text" id="prestataire" name="prestataire" className="form-control" placeholder="ex: ChauffagePro" />
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
