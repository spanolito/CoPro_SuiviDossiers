import Sidebar from '@/components/layout/Sidebar'
import { headers } from 'next/headers'
import Header from '@/components/layout/Header'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { SidebarProvider } from '@/components/layout/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  const userName = (payload?.name as string) || 'Utilisateur'
  let rawRole = (payload?.role as string) || 'Read-only'
  
  let userRole = 'Copropriétaire'
  if (rawRole === 'admin') userRole = 'Président du CS'
  else if (rawRole === 'cs') userRole = 'Membre du CS'

  return (
    <SidebarProvider>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Header 
            userName={userName} 
            userRole={userRole} 
          />
          <main className="page-container">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

