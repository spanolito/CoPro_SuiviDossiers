import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { Permission, requirePermission } from '@/lib/security/rbac'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const payload = token ? await verifyToken(token) : null
    
    // Strict RBAC check
    try {
      requirePermission(payload as any, Permission.LOGBOOK_EXPORT)
    } catch (e: any) {
      if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      throw e
    }

    const { searchParams } = new URL(request.url)
    const userFilter = searchParams.get('user')
    const dateFilter = searchParams.get('date')

    const whereClause: any = {}
    if (userFilter) {
      whereClause.userId = userFilter
    }
    if (dateFilter) {
      const startOfDay = new Date(dateFilter)
      startOfDay.setHours(0,0,0,0)
      const endOfDay = new Date(dateFilter)
      endOfDay.setHours(23,59,59,999)
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay }
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        utilisateur: {
          select: { nomAffiche: true }
        }
      }
    })

    // Generate CSV
    const headers = ['Date', 'Utilisateur', 'Action', 'Description']
    const rows = logs.map((log: any) => {
      const date = new Date(log.createdAt).toLocaleString('fr-FR')
      const user = log.utilisateur?.nomAffiche || 'Système'
      const action = log.action
      const desc = `"${(log.description || '').replace(/"/g, '""')}"`
      return [date, user, action, desc].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="journal_de_bord.csv"',
      }
    })

  } catch (error) {
    console.error('API Logbook Export Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
