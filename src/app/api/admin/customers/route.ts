import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Hent alle brukere med paginering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const roleParam = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    
    // Valider paginering parametere
    if (page < 1 || limit < 1 || limit > 500) {
      return NextResponse.json(
        { message: 'Ugyldige paginering parametere' },
        { status: 400 }
      )
    }
    
    const skip = (page - 1) * limit

    // Bygg where-clause basert på role parameter
    let whereClause: any = {}
    
    if (roleParam === 'staff') {
      // Kun ADMIN og ANSATT (for opplæring)
      whereClause = {
        role: {
          in: ['ADMIN', 'ANSATT']
        }
      }
    } else if (roleParam === 'all') {
      // Alle brukere
      whereClause = {}
    } else {
      // Default: ikke admin-brukere
      whereClause = {
        role: {
          not: 'ADMIN'
        }
      }
    }

    // Hent totalt antall for paginering
    const total = await prisma.user.count({ where: whereClause })
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        firstName: 'asc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Feil ved henting av brukere' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Sjekk autentisering
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const { firstName, lastName, email, phone, password, role } = await req.json()

    // Validering
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'Fornavn, etternavn og e-post er påkrevd' },
        { status: 400 }
      )
    }

    // Valider rolle
    const validRoles = ['USER', 'ANSATT', 'WORKSHOP', 'ADMIN']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Ugyldig brukerrolle' },
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

    // Sjekk om e-post allerede eksisterer
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'En bruker med denne e-postadressen eksisterer allerede' },
        { status: 409 }
      )
    }

    // Hvis passord er angitt, valider og hash det
    let hashedPassword = null
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Passordet må være minst 6 tegn' },
          { status: 400 }
        )
      }
      hashedPassword = await bcrypt.hash(password, 12)
    } else {
      // Generer et tilfeldig passord hvis ingen er angitt
      const randomPassword = crypto.randomBytes(16).toString('hex')
      hashedPassword = await bcrypt.hash(randomPassword, 12)
    }

    // Opprett ny kunde
    const newCustomer = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: role || 'USER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    })

    // Customer created successfully

    return NextResponse.json(
      {
        message: 'Kunde opprettet',
        customer: newCustomer
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { message: 'Feil ved opprettelse av kunde' },
      { status: 500 }
    )
  }
}

