import Sidebar from '@/components/layout/Sidebar'
import { headers } from 'next/headers'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userName = 'Oscar Andujar' // Hardcoded for now, normally fetched from DB or Token
  const userRole = headersList.get('x-user-role') || 'Admin'

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Header 
          title="Tableau de bord" 
          userName={userName} 
          userRole={userRole} 
        />
        <main className="page-container">
          {children}
        </main>
      </div>
    </>
  )
}
