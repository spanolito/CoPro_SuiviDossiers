import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/server'
import { logActivity } from '@/lib/activity-log'

export async function POST(request: NextRequest) {
  try {
    let payload;
    try {
      payload = await requirePermission('logbook.delete')
    } catch (e: any) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    if (body.confirmation !== 'SUPPRIMER') {
      return NextResponse.json({ error: 'Confirmation invalide. Vous devez taper EXACTEMENT : SUPPRIMER' }, { status: 400 })
    }

    await prisma.auditLog.deleteMany({})

    // Log the purge action itself
    await logActivity({
      userId: payload?.id as string,
      action: 'LOGBOOK_DELETE',
      entity: 'SYSTEM',
      entityId: 'AUDIT_LOGS',
      metadata: { description: 'Journal de bord effacé' }
    })

    return NextResponse.json({ success: true, message: 'Journal de bord effacé avec succès.' })

  } catch (error) {
    console.error('API Logbook Delete Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
