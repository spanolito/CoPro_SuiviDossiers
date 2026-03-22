import { Search, Bell } from 'lucide-react'
import styles from './layout.module.css'

interface HeaderProps {
  title: string
  userName?: string
  userRole?: string
}

export default function Header({ title, userName = 'Utilisateur', userRole = 'Conseil syndical' }: HeaderProps) {
  const initials = userName.substring(0, 2).toUpperCase()

  return (
    <header className={styles.header}>
      <div className={styles.headerTitle}>{title}</div>
      <div className={styles.headerRight}>
        <div className={styles.searchBar}>
          <Search size={18} color="var(--text-secondary)" />
          <input type="text" placeholder="Rechercher un dossier..." className={styles.searchInput} />
        </div>
        
        <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }}></span>
        </div>

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
