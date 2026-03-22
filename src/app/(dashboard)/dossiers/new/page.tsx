import prisma from '@/lib/prisma'
import styles from './new-dossier.module.css'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LocalisationClient from '@/components/dossiers/LocalisationClient'
import AssignationClient from '@/components/dossiers/AssignationClient'

export default async function NewDossierPage() {
  const categories = await prisma.category.findMany()
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const prestataires = await prisma.prestataire.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } })

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
    
    const typeDossier = formData.get('typeDossier') as string
    const responsableCSId = formData.get('responsableCSId') as string
    const actionValue = formData.get('actionValue') as string // 'user:id' or 'prestataire:id'

    let actionUserId: string | null = null
    let prestataireId: string | null = null

    if (actionValue) {
      const [type, id] = actionValue.split(':')
      if (type === 'user') actionUserId = id
      if (type === 'prestataire') prestataireId = id
    }

    // Heating specific context handled if the category is heating (or regardless to not limit it in this demo)
    const typeInstallation = formData.get('typeInstallation') as string
    const prestataireForm = formData.get('prestataire') as string // wait, this was the string field!
    // I already removed the string field 'prestataire' from schema and seed!
    // I can safely drop reading 'prestataire' string or keep reading it if I need to discard it.
    // Let's just create variables for schema support.
    const contratMaintenance = formData.get('contratMaintenance') as string || null

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
        typeDossier,
        categoryId,
        responsableCSId: responsableCSId || null,
        prestataireId: prestataireId || null,
        actionUserId: actionUserId || null,
        typeInstallation,
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
          <AssignationClient users={users} prestataires={prestataires} />
        </div>

        <h2 className={styles.sectionTitle}>Spécifique Chauffage / Équipements techniques</h2>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label htmlFor="typeInstallation">Type d'installation</label>
            <input type="text" id="typeInstallation" name="typeInstallation" className="form-control" placeholder="ex: Chaudière Gaz, PAC" />
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
