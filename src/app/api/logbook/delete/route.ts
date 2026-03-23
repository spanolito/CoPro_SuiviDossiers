import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { Permission, requirePermission } from '@/lib/security/rbac'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const payload = token ? await verifyToken(token) : null
    
    // Strict RBAC check
    try {
      requirePermission(payload as any, Permission.LOGBOOK_DELETE)
    } catch (e: any) {
      if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      throw e
    }

    const body = await request.json()
    if (body.confirmation !== 'SUPPRIMER') {
      return NextResponse.json({ error: 'Confirmation invalide. Vous devez taper EXACTEMENT : SUPPRIMER' }, { status: 400 })
    }

    await prisma.auditLog.deleteMany({})

    // Log the purge action itself
    await prisma.auditLog.create({
      data: {
        userId: payload?.id as string,
        action: 'LOGBOOK_DELETE',
        description: 'Le journal de bord a été entièrement effacé.',
      }
    })

    return NextResponse.json({ success: true, message: 'Journal de bord effacé avec succès.' })

  } catch (error) {
    console.error('API Logbook Delete Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
