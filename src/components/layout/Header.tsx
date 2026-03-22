import { Search } from 'lucide-react'
import NotificationBell from './NotificationBell'
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
