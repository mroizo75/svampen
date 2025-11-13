import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/services/[id] - Hent en spesifikk tjeneste
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        servicePrices: {
          include: {
            vehicleType: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Tjeneste ikke funnet' },
        { status: 404 }
      )
    }

    // Serialiser Decimal til number
    const serializedService = {
      ...service,
      servicePrices: service.servicePrices.map(sp => ({
        ...sp,
        price: Number(sp.price),
      })),
    }

    return NextResponse.json(serializedService)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av tjeneste' },
      { status: 500 }
    )
  }
}

// PATCH /api/services/[id] - Oppdater en tjeneste
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await request.json()
    const { name, description, duration, category, isActive, isAdminOnly, prices } = data

    // Valider påkrevde felter
    if (!name || !description || !duration || !category) {
      return NextResponse.json(
        { message: 'Navn, beskrivelse, varighet og kategori er påkrevd' },
        { status: 400 }
      )
    }

    // Sjekk om tjenesten eksisterer
    const existingService = await prisma.service.findUnique({
      where: { id },
    })

    if (!existingService) {
      return NextResponse.json(
        { message: 'Tjeneste ikke funnet' },
        { status: 404 }
      )
    }

    // Sjekk om navnet er i bruk av en annen tjeneste
    if (name !== existingService.name) {
      const nameExists = await prisma.service.findFirst({
        where: {
          name,
          id: { not: id },
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { message: 'En tjeneste med dette navnet eksisterer allerede' },
          { status: 409 }
        )
      }
    }

    // Oppdater tjeneste
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        duration: Number(duration),
        category,
        isActive: isActive !== undefined ? isActive : existingService.isActive,
        isAdminOnly: isAdminOnly !== undefined ? isAdminOnly : existingService.isAdminOnly,
      },
      include: {
        servicePrices: {
          include: {
            vehicleType: true,
          },
        },
      },
    })

    // Hvis priser er inkludert, oppdater dem
    if (prices && typeof prices === 'object') {
      // Oppdater eller opprett priser
      for (const [vehicleTypeId, price] of Object.entries(prices)) {
        if (typeof price === 'number' && price >= 0) {
          await prisma.servicePrice.upsert({
            where: {
              serviceId_vehicleTypeId: {
                serviceId: id,
                vehicleTypeId,
              },
            },
            update: {
              price,
            },
            create: {
              serviceId: id,
              vehicleTypeId,
              price,
            },
          })
        }
      }

      // Hent oppdatert tjeneste med priser
      const serviceWithPrices = await prisma.service.findUnique({
        where: { id },
        include: {
          servicePrices: {
            include: {
              vehicleType: true,
            },
          },
        },
      })

      const serializedService = {
        ...serviceWithPrices!,
        servicePrices: serviceWithPrices!.servicePrices.map(sp => ({
          ...sp,
          price: Number(sp.price),
        })),
      }

      return NextResponse.json(serializedService)
    }

    // Serialiser og returner
    const serializedService = {
      ...updatedService,
      servicePrices: updatedService.servicePrices.map(sp => ({
        ...sp,
        price: Number(sp.price),
      })),
    }

    return NextResponse.json(serializedService)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved oppdatering av tjeneste' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id] - Slett en tjeneste
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Sjekk om tjenesten er i bruk
    const bookingServices = await prisma.bookingService.findFirst({
      where: { serviceId: id },
    })

    if (bookingServices) {
      return NextResponse.json(
        { message: 'Tjenesten kan ikke slettes fordi den er i bruk i eksisterende bookinger' },
        { status: 409 }
      )
    }

    // Slett priser først (cascade)
    await prisma.servicePrice.deleteMany({
      where: { serviceId: id },
    })

    // Slett tjenesten
    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Tjeneste slettet' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved sletting av tjeneste' },
      { status: 500 }
    )
  }
}

