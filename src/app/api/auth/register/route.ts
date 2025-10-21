import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password } = await req.json()

    // Validering
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Alle feltene er påkrevd' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Passordet må være minst 6 tegn' },
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

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'En intern feil oppstod' },
      { status: 500 }
    )
  }
}