import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 })
    }

    // Get default role (Read-only)
    let defaultRole = await prisma.role.findUnique({
      where: { name: 'Read-only' },
    })

    if (!defaultRole) {
      // In case seed wasn't fully run, fallback or throw
      defaultRole = await prisma.role.create({
        data: { name: 'Read-only' }
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: defaultRole.id,
        status: 'PENDING',
      },
      include: { role: true },
    })

    // Optionally: Notify Admins of new user
    const admins = await prisma.user.findMany({
      where: { role: { name: 'Admin' } }
    })
    
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        title: 'Nouvelle inscription',
        message: `L'utilisateur ${name} (${email}) demande l'accès et attend validation.`,
        userId: admin.id
      }))
      
      await prisma.notification.createMany({
        data: notifications
      })
    }

    return NextResponse.json(
      { success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
