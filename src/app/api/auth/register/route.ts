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

    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 })
    }

    // Get the copropriete (single one in our case)
    const copro = await prisma.copropriete.findFirst()
    if (!copro) {
      return NextResponse.json({ error: 'Aucune copropriété configurée.' }, { status: 500 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.utilisateur.create({
      data: {
        coproprieteId: copro.id,
        email,
        passwordHash: hashedPassword,
        nomAffiche: name,
        role: 'COPROPRIETAIRE_LECTURE',
        status: 'PENDING',
      },
    })

    // Notify Président du CS
    const admins = await prisma.utilisateur.findMany({
      where: { role: 'PRESIDENT_CS' }
    })

    if (admins.length > 0) {
      const { sendEmail } = await import('@/lib/services/email') // Dynamic import to avoid edge runtime issues if applicable, but standard import top is fine. Let's use top import for safety or dynamic for Next actions framework standard. Top import is fine.
      
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'NOUVEL_UTILISATEUR',
            titre: 'Nouvelle inscription',
            message: `L'utilisateur ${name} (${email}) demande l'accès et attend validation.`,
          }
        })

        await sendEmail({
          to: admin.email,
          subject: 'Nouvelle demande d\'accès - CoPro Suivi',
          body: `L'utilisateur ${name} (${email}) a créé un compte et demande l'accès en tant que copropriétaire.\n\nDate de la demande: ${new Date().toLocaleString('fr-FR')}`
        })
      }
    }


    return NextResponse.json(
      { success: true, user: { id: newUser.id, email: newUser.email, name: newUser.nomAffiche } },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
