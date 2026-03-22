'use client'

import { Search } from 'lucide-react'
import NotificationBell from './NotificationBell'
import styles from './layout.module.css'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  userName?: string
  userRole?: string
}

const titleMap: Record<string, string> = {
  '/': 'Vue d\'ensemble',
  '/dossiers': 'Répertoire des dossiers',
  '/import': 'Import de dossiers',
  '/profil': 'Mon profil',
  '/users': 'Gestion des utilisateurs',
  '/settings': 'Paramètres de l\'application'
}

export default function Header({ userName = 'Utilisateur', userRole = 'Membre du Conseil Syndical' }: HeaderProps) {
  const pathname = usePathname()
  const initials = userName.substring(0, 2).toUpperCase()

  // Find exact match or falls back to generic fallback
  const title = titleMap[pathname] || 
                (pathname.startsWith('/dossiers/') ? 'Détail du dossier' : 'Tableau de bord')

  return (
    <header className={styles.header}>
      <div className={styles.headerTitle}>{title}</div>
      <div className={styles.headerRight}>
        <div className={styles.searchBar}>
          <Search size={18} color="var(--text-secondary)" />
          <input type="text" placeholder="Rechercher un dossier..." className={styles.searchInput} />
        </div>
        
        <NotificationBell />

        <div className={styles.userProfile}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
