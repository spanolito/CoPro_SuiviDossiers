import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
    }

    const user = await prisma.utilisateur.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 })
    }

    if (user.status === 'PENDING') {
      return NextResponse.json({ error: 'Votre compte est en attente de validation par le Président du CS.' }, { status: 403 })
    }

    if (user.status === 'DISABLED') {
      return NextResponse.json({ error: 'Votre compte a été désactivé.' }, { status: 403 })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 })
    }

    const roleLabel = user.role === 'PRESIDENT_CS' ? 'Admin' : user.role === 'MEMBRE_CS' ? 'Conseil syndical' : 'Read-only'

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: roleLabel,
      name: user.nomAffiche,
    })

    const response = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, name: user.nomAffiche, role: roleLabel } },
      { status: 200 }
    )

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
    })

    // Update last login
    await prisma.utilisateur.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        description: `Connexion réussie de ${user.nomAffiche}`,
      }
    })
    

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
