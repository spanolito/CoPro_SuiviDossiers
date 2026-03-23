'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, Calendar, User, Search } from 'lucide-react'
import styles from './logbook.module.css'

export default function LogbookAdmin() {
  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  
  // Filters
  const [filterUser, setFilterUser] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Modal deletion
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    fetchLogs(1)
    fetchUsers()
  }, [filterUser, filterDate])

  const fetchLogs = async (page: number) => {
    setLoading(true)
    try {
      let url = `/api/logbook?page=${page}&limit=${pagination.limit}`
      if (filterUser) url += `&user=${filterUser}`
      if (filterDate) url += `&date=${filterDate}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.logs) {
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('Fetch logs error:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Assuming layout handles users fetch or direct layout endpoint is available
      const res = await fetch('/api/users') // Create this inside as well if not exist, or fetch standard Prisma inline?
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = () => {
    let url = `/api/logbook/export?`
    if (filterUser) url += `user=${filterUser}&`
    if (filterDate) url += `date=${filterDate}&`
    window.location.href = url
  }

  const handleDeleteAll = async () => {
    if (confirmText !== 'SUPPRIMER') {
      setModalError('Vous devez taper EXACTEMENT : SUPPRIMER')
      return
    }
    setModalLoading(true)
    setModalError('')
    try {
      const res = await fetch('/api/logbook/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'SUPPRIMER' })
      })
      const data = await res.json()
      if (res.ok) {
        setLogs([])
        setPagination({ ...pagination, total: 0, totalPages: 1 })
        setIsModalOpen(false)
      } else {
        setModalError(data.error || 'Erreur lors de la suppression')
      }
    } catch (e) {
      setModalError('Erreur lors de la suppression')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <Calendar size={16} />
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => { setFilterDate(e.target.value); fetchLogs(1); }} 
              className="form-control" 
            />
          </div>
          <div className={styles.filterItem}>
            <User size={16} />
            <select 
              value={filterUser} 
              onChange={e => { setFilterUser(e.target.value); fetchLogs(1); }} 
              className="form-control"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nomAffiche}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={handleExport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Exporter CSV
          </button>
          <button onClick={() => { setIsModalOpen(true); setConfirmText(''); setModalError(''); }} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={16} /> Effacer le journal
          </button>
        </div>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.date).toLocaleString('fr-FR')}</td>
                  <td><span className="badge badge-normal">{log.utilisateur}</span></td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.cible}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun enregistrement trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            disabled={pagination.page === 1} 
            onClick={() => fetchLogs(pagination.page - 1)}
            className="btn btn-outline"
          >Précédent</button>
          <span>Page {pagination.page} sur {pagination.totalPages}</span>
          <button 
            disabled={pagination.page === pagination.totalPages} 
            onClick={() => fetchLogs(pagination.page + 1)}
            className="btn btn-outline"
          >Suivant</button>
        </div>
      )}

      {/* Deletion Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Supprimer l'intégralité du journal ?</h3>
            <p>Cette action est irréversible. Pour confirmer, veuillez taper le mot <strong>SUPPRIMER</strong> ci-dessous :</p>
            <input 
              type="text" 
              placeholder="Tapez SUPPRIMER" 
              value={confirmText} 
              onChange={e => setConfirmText(e.target.value)} 
              className="form-control"
              style={{ margin: '16px 0', width: '100%' }}
            />
            {modalError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{modalError}</p>}
            <div className={styles.modalActions}>
              <button disabled={modalLoading} onClick={() => setIsModalOpen(false)} className="btn btn-outline">Annuler</button>
              <button disabled={modalLoading} onClick={handleDeleteAll} className="btn btn-danger">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
