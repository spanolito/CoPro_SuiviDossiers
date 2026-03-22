'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription.")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
          <Building size={48} color="var(--primary)" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ marginBottom: 16 }}>Inscription réussie !</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            Votre compte a été créé avec succès. Il est actuellement <strong>en attente de validation</strong> par un administrateur. 
            Vous serez redirigé vers la page de connexion dans un instant.
          </p>
          <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ width: '100%' }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 400, width: '100%', padding: 32, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--panel-bg)'}}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Building size={48} color="var(--primary)" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Créer un compte</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Rejoignez l'espace Copropriété</p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Nom complet</label>
          <input type="text" id="name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jean Dupont" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Email</label>
          <input type="email" id="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jean@example.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Mot de passe</label>
          <input type="password" id="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        </div>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Confirmer le mot de passe</label>
          <input type="password" id="confirmPassword" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
          {loading ? 'Inscription en cours...' : 'S\'inscrire'}
        </button>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Vous avez déjà un compte ?{' '}
          <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Se connecter
          </a>
        </div>
      </form>
    </div>
  )
}
