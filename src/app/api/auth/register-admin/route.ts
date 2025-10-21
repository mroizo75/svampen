import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

/**
 * Sikker admin-registrering endpoint
 * Krever ADMIN_REGISTRATION_SECRET i .env
 * 
 * POST /api/auth/register-admin
 * Body: {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone?: string,
 *   password: string,
 *   adminSecret: string (fra .env)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, adminSecret } = await req.json()

    // Validering
    if (!firstName || !lastName || !email || !password || !adminSecret) {
      return NextResponse.json(
        { message: 'Alle påkrevde felt må fylles ut (firstName, lastName, email, password, adminSecret)' },
        { status: 400 }
      )
    }

    // Sjekk admin secret
    const envAdminSecret = process.env.ADMIN_REGISTRATION_SECRET

    if (!envAdminSecret) {
      console.error('ADMIN_REGISTRATION_SECRET is not configured in .env')
      return NextResponse.json(
        { message: 'Admin registrering er ikke konfigurert på serveren' },
        { status: 500 }
      )
    }

    if (adminSecret !== envAdminSecret) {
      console.warn(`Failed admin registration attempt for email: ${email}`)
      return NextResponse.json(
        { message: 'Ugyldig admin secret. Tilgang nektet.' },
        { status: 403 }
      )
    }

    // Validering av passord
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Passordet må være minst 6 tegn' },
        { status: 400 }
      )
    }

    // Email validering
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Ugyldig e-postadresse' },
        { status: 400 }
      )
    }

    // Sjekk om brukeren allerede eksisterer
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'En bruker med denne e-postadressen eksisterer allerede' },
        { status: 409 }
      )
    }

    // Hash passordet
    const hashedPassword = await bcrypt.hash(password, 12)

    // Opprett admin bruker
    const admin = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: UserRole.ADMIN, // Viktig: Setter rollen til ADMIN
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    })

    console.log(`✅ Admin bruker opprettet: ${admin.email}`)

    return NextResponse.json(
      { 
        message: 'Admin bruker opprettet successfully', 
        admin,
        note: 'Du kan nå logge inn med denne e-posten og passordet ditt'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Admin registration error:', error)
    return NextResponse.json(
      { message: 'En intern feil oppstod ved admin registrering' },
      { status: 500 }
    )
  }
}

