import ImportForm from './ImportForm'

export default async function ImportPage() {
  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Import de Dossiers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Générez automatiquement des dossiers à partir de vos comptes rendus de réunion ou e-mails.
          </p>
        </div>
      </div>

      <ImportForm />
    </div>
  )
}
