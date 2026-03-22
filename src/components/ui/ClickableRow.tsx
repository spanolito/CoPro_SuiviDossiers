'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

export default function ClickableRow({ 
  href, 
  children, 
  style 
}: { 
  href: string; 
  children: ReactNode; 
  style?: React.CSSProperties 
}) {
  const router = useRouter()

  return (
    <tr 
      onClick={() => router.push(href)} 
      style={{ cursor: 'pointer', ...style }}
    >
      {children}
    </tr>
  )
}
