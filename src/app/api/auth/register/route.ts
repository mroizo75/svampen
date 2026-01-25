import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { registerSchema } from '@/lib/validation'
import { rateLimiter, getClientIp } from '@/lib/rate-limiter'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - Maks 3 registreringer per IP per 15 min
    const ip = getClientIp(req)
    const rateLimitKey = `register:${ip}`
    const isAllowed = rateLimiter.checkCustomLimit(
      rateLimitKey, 
      3, // Maks 3 forsøk
      15 * 60 * 1000, // 15 minutter window
      30 * 60 * 1000  // Blokker i 30 minutter
    )
    
    if (!isAllowed) {
      console.warn(`🚨 Registration rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { message: 'For mange registreringsforsøk. Prøv igjen om 30 minutter.' },
        { status: 429 }
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

    // Opprett bruker
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.USER,
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

    return NextResponse.json(
      { message: 'Bruker opprettet successfully', user },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Registration error:', error)
    
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
      { message: 'En intern feil oppstod' },
      { status: 500 }
    )
  }
}