import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generatePlaceholderEmail, isRealCustomerEmail } from '@/lib/customer-email'

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
    const { firstName, lastName, email, phone, address, postalCode, city } = data

    const existingCustomer = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { message: 'Kunde ikke funnet' },
        { status: 404 }
      )
    }

    const nextFirstName =
      typeof firstName === 'string' && firstName.trim()
        ? firstName.trim()
        : existingCustomer.firstName
    const nextLastName =
      typeof lastName === 'string' && lastName.trim()
        ? lastName.trim()
        : existingCustomer.lastName
    const nextPhone =
      phone !== undefined ? (typeof phone === 'string' && phone.trim() ? phone.trim() : null) : existingCustomer.phone

    let nextEmail = existingCustomer.email
    if (email !== undefined) {
      const trimmedEmail = typeof email === 'string' ? email.trim() : ''

      if (isRealCustomerEmail(trimmedEmail)) {
        nextEmail = trimmedEmail.toLowerCase()
      } else if (!trimmedEmail) {
        if (!nextPhone) {
          return NextResponse.json(
            { message: 'Oppgi e-post eller telefonnummer' },
            { status: 400 }
          )
        }
        nextEmail = isRealCustomerEmail(existingCustomer.email)
          ? generatePlaceholderEmail(nextFirstName, nextLastName)
          : existingCustomer.email
      } else {
        return NextResponse.json(
          { message: 'Ugyldig e-postadresse' },
          { status: 400 }
        )
      }
    }

    if (!isRealCustomerEmail(nextEmail) && !nextPhone) {
      return NextResponse.json(
        { message: 'Oppgi e-post eller telefonnummer' },
        { status: 400 }
      )
    }

    if (isRealCustomerEmail(nextEmail) && nextEmail !== existingCustomer.email.toLowerCase()) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: nextEmail,
          NOT: { id },
        },
        select: { firstName: true, lastName: true },
      })

      if (existingUser) {
        return NextResponse.json(
          {
            message: `E-posten tilhører allerede kunden "${existingUser.firstName} ${existingUser.lastName}". Deaktiver den kontoen først hvis det er en feilregistrering.`,
          },
          { status: 400 }
        )
      }
    }

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: {
        firstName: nextFirstName,
        lastName: nextLastName,
        email: nextEmail,
        phone: nextPhone,
        address: address !== undefined ? (address || null) : existingCustomer.address,
        postalCode: postalCode !== undefined ? (postalCode || null) : existingCustomer.postalCode,
        city: city !== undefined ? (city || null) : existingCustomer.city,
      },
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { message: 'E-postadressen er allerede i bruk' },
        { status: 400 }
      )
    }
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

