import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Copropriété - L\'Ambassadeur',
  description: 'Application de suivi de dossiers de copropriété',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  )
}
