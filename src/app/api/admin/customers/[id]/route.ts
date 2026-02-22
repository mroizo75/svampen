import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/customers/[id] - Oppdater kunde
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ingen tilgang' },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await request.json()

    // Valider input
    const { firstName, lastName, email, phone, address, postalCode, city } = data

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'Fornavn, etternavn og e-post er påkrevd' },
        { status: 400 }
      )
    }

    // Sjekk om e-posten allerede er i bruk av en annen bruker
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { message: 'E-postadressen er allerede i bruk' },
          { status: 400 }
        )
      }
    }

    // Oppdater kunden
    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        postalCode: postalCode || null,
        city: city || null,
      },
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { message: 'Kunne ikke oppdatere kunde' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/customers/[id] - Deaktiver kunde (anonymiserer e-post slik at den kan gjenbrukes)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Ingen tilgang' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Kunde ikke funnet' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin-kontoer kan ikke deaktiveres her' },
        { status: 400 }
      )
    }

    // Anonymiser e-posten slik at den originale adressen frigjøres
    const anonymizedEmail = `deaktivert_${id}_${Date.now()}@ugyldig.svampen`

    await prisma.user.update({
      where: { id },
      data: { email: anonymizedEmail },
    })

    return NextResponse.json({ message: 'Konto deaktivert' })
  } catch (error) {
    console.error('Error deactivating customer:', error)
    return NextResponse.json(
      { message: 'Kunne ikke deaktivere konto' },
      { status: 500 }
    )
  }
}

// GET /api/admin/customers/[id] - Hent kunde
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ingen tilgang' },
        { status: 403 }
      )
    }

    const { id } = await params

    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            bookingVehicles: {
              include: {
                vehicleType: true,
                bookingServices: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Kunde ikke funnet' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { message: 'Kunne ikke hente kunde' },
      { status: 500 }
    )
  }
}

