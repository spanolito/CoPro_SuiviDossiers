'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Users, Settings, LogOut, Building, Upload, UserCircle, BarChart, Briefcase } from 'lucide-react'
import styles from './layout.module.css'
import { useSidebar } from './SidebarContext'

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, closeSidebar } = useSidebar()

  const isAuthorized = userRole === 'admin' || userRole === 'PRESIDENT_CS'

  const navItems = [
    { name: 'Vue d\'ensemble', href: '/', icon: LayoutDashboard },
    { name: 'Dossiers', href: '/dossiers', icon: FileText },
    { name: 'Prestataires', href: '/prestataires', icon: Briefcase },
    { name: 'Rapports', href: '/rapports', icon: BarChart },
    { name: 'Import', href: '/import', icon: Upload },
    { name: 'Utilisateurs', href: '/users', icon: Users },
    { name: 'Préférences', href: '/preferences', icon: Settings },
  ].filter(item => !['/rapports', '/import', '/users'].includes(item.href) || isAuthorized)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={closeSidebar} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <Building className={styles.logoIcon} />
          Copropriété - L'Ambassadeur
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
                onClick={closeSidebar}
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
    </>
  )
}

