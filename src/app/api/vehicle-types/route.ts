import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(vehicleTypes)
  } catch (error) {
    console.error('Error fetching vehicle types:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av kjøretøy typer' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Kun admin kan opprette kjøretøy typer
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Navn er påkrevd' },
        { status: 400 }
      )
    }

    // Sjekk om navnet allerede eksisterer
    const existing = await prisma.vehicleType.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'En kjøretøy type med dette navnet eksisterer allerede' },
        { status: 400 }
      )
    }

    // Opprett ny kjøretøy type
    const vehicleType = await prisma.vehicleType.create({
      data: {
        name,
        description: description || null,
      },
    })

    return NextResponse.json(vehicleType, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle type:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette kjøretøy type' },
      { status: 500 }
    )
  }
}