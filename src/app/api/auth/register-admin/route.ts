import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import * as rateLimiter from '@/lib/rate-limiter'
import { registerSchema } from '@/lib/validation'

/**
 * Sikker admin-registrering endpoint
 * Krever ADMIN_REGISTRATION_SECRET i Authorization header
 * Rate limiting: Maks 3 forsøk per 15 min per IP
 * 
 * POST /api/auth/register-admin
 * Headers: {
 *   Authorization: Bearer <ADMIN_REGISTRATION_SECRET>
 * }
 * Body: {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone?: string,
 *   password: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - veldig strengt for admin-registrering
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    
    const rateLimitKey = `admin-reg:${ip}`
    const isAllowed = rateLimiter.rateLimiter.checkCustomLimit(
      rateLimitKey, 
      3, // Maks 3 forsøk
      15 * 60 * 1000, // 15 minutter window
      30 * 60 * 1000  // Blokker i 30 minutter
    )
    
    if (!isAllowed) {
      console.warn(`🚨 Admin registration rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { message: 'For mange forsøk. Prøv igjen om 15 minutter.' },
        { status: 429 }
      )
    }

    // Sjekk Authorization header
    const authHeader = req.headers.get('authorization')
    const envAdminSecret = process.env.ADMIN_REGISTRATION_SECRET

    if (!envAdminSecret) {
      console.error('ADMIN_REGISTRATION_SECRET is not configured in .env')
      return NextResponse.json(
        { message: 'Admin registrering er ikke konfigurert på serveren' },
        { status: 500 }
      )
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization header mangler eller er ugyldig' },
        { status: 401 }
      )
    }

    const providedSecret = authHeader.substring(7) // Fjern "Bearer "

    if (providedSecret !== envAdminSecret) {
      console.warn(`Failed admin registration attempt from IP: ${ip}`)
      return NextResponse.json(
        { message: 'Ugyldig admin secret. Tilgang nektet.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // Valider input med Zod
    const validatedData = registerSchema.parse(body)
    const { firstName, lastName, email, phone, password } = validatedData

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

    // Admin user created successfully

    return NextResponse.json(
      { 
        message: 'Admin bruker opprettet successfully', 
        admin,
        note: 'Du kan nå logge inn med denne e-posten og passordet ditt'
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Admin registration error:', error)
    
    // Håndter Zod valideringsfeil
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          message: 'Valideringsfeil', 
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'En intern feil oppstod ved admin registrering' },
      { status: 500 }
    )
  }
}

