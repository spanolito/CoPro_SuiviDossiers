import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      color: 'var(--text-secondary)',
      gap: '16px'
    }}>
      <Settings size={64} color="var(--primary)" style={{ opacity: 0.8 }} />
      <h2 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Page en construction</h2>
      <p style={{ fontSize: '14px' }}>Cette page sera disponible prochainement.</p>
    </div>
  )
}
