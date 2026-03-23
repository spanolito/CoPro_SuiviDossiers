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
      requirePermission(payload as any, Permission.LOGBOOK_READ)
    } catch (e: any) {
      if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      throw e
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const userFilter = searchParams.get('user')
    const dateFilter = searchParams.get('date') // YYYY-MM-DD

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

    const total = await prisma.auditLog.count({ where: whereClause })

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        utilisateur: {
          select: { nomAffiche: true }
        }
      }
    })

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        id: log.id,
        date: log.createdAt,
        utilisateur: log.utilisateur?.nomAffiche || 'Système',
        action: log.action,
        cible: log.description, // Matching target mapping layout effectively
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('API Logbook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
