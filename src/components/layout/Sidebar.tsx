'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Users, Settings, LogOut, Building, Upload } from 'lucide-react'
import styles from './layout.module.css'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: 'Vue d\'ensemble', href: '/', icon: LayoutDashboard },
    { name: 'Dossiers', href: '/dossiers', icon: FileText },
    { name: 'Import', href: '/import', icon: Upload },
    { name: 'Utilisateurs', href: '/users', icon: Users },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Building className={styles.navItemIcon} />
        CoPro Suivi
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navItemIcon} />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut className={styles.navItemIcon} />
        Déconnexion
      </button>
    </aside>
  )
}
