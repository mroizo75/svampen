import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    const { firstName, lastName, email, phone, password } = await req.json()

    // Validering
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'Fornavn, etternavn og e-post er påkrevd' },
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
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
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
        role: 'USER',
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

    console.log(`✅ Ny kunde opprettet av admin: ${newCustomer.email}`)

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

