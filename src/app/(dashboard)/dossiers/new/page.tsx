import prisma from '@/lib/prisma'
import styles from './new-dossier.module.css'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LocalisationClient from '@/components/dossiers/LocalisationClient'

export default async function NewDossierPage() {
  const categories = await prisma.category.findMany()
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const intervenants = await prisma.intervenant.findMany({ orderBy: { nom: 'asc' } })

  // Server Action
  async function createDossier(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const priorite = formData.get('priorite') as string
    const description = formData.get('description') as string
    const typeLocalisation = formData.get('typeLocalisation') as string
    const niveau = formData.get('niveau') as string
    const localisation = formData.get('localisation') as string
    const precision = formData.get('precision') as string
    
    const responsableCSId = formData.get('responsableCSId') as string
    const intervenantId = formData.get('intervenantId') as string

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
        statut: 'ENREGISTRE',
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
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          <LocalisationClient />
          <div className="form-group">
            <label htmlFor="responsableCSId">Responsable CS *</label>
            <select id="responsableCSId" name="responsableCSId" className="form-control" required>
              <option value="">Sélectionner</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="intervenantId">Responsable de l'action *</label>
            <select id="intervenantId" name="intervenantId" className="form-control" required>
              <option value="">Sélectionner</option>
              {intervenants.map((i: any) => <option key={i.id} value={i.id}>{i.nom} ({i.type})</option>)}
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
