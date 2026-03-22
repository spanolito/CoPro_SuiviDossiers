'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DossierFilters({
  currentQ,
  currentStatus,
  currentPriority,
  currentArchived
}: {
  currentQ: string;
  currentStatus: string;
  currentPriority: string;
  currentArchived: string;
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(currentQ)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set('q', search)
      } else {
        params.delete('q')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 400) // 400ms debounce

    return () => clearTimeout(handler)
  }, [search, router, pathname, searchParams])

  const handleSelectChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '16px', 
      background: 'var(--panel-bg)', 
      padding: '20px', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--border-color)', 
      boxShadow: 'var(--shadow-sm)',
      marginBottom: '24px',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Recherche</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Référence ou titre..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              padding: '10px 12px 10px 36px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              fontSize: '14px', 
              width: '100%',
              background: '#FDFCFB'
            }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Statut</label>
        <select 
          value={currentStatus} 
          onChange={(e) => handleSelectChange('status', e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)', 
            fontSize: '14px',
            background: '#FDFCFB'
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="ENREGISTRE">Enregistré</option>
          <option value="AFFECTE">Affecté</option>
          <option value="EN_COURS">En Cours</option>
          <option value="A_VALIDER">À Valider</option>
          <option value="CLOTURE">Clôturé</option>
          <option value="BLOQUE">Bloqué</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Priorité</label>
        <select 
          value={currentPriority} 
          onChange={(e) => handleSelectChange('priority', e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)', 
            fontSize: '14px',
            background: '#FDFCFB'
          }}
        >
          <option value="">Toutes les priorités</option>
          <option value="CRITIQUE">Critique</option>
          <option value="HAUTE">Haute</option>
          <option value="MOYENNE">Moyenne</option>
          <option value="BASSE">Basse</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Affichage</label>
        <select 
          value={currentArchived || 'active'} 
          onChange={(e) => handleSelectChange('archived_status', e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)', 
            fontSize: '14px',
            background: '#FDFCFB'
          }}
        >
          <option value="active">Actifs uniquement</option>
          <option value="archived">Archivés uniquement</option>
          <option value="all">Tous</option>
        </select>
      </div>
    </div>
  )
}
