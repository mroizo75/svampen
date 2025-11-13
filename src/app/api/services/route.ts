import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Sjekk om bruker er admin eller ansatt
    const isAdminOrStaff = session?.user && ['ADMIN', 'ANSATT'].includes(session.user.role || '')
    
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        // Hvis IKKE admin/ansatt, filtrer bort admin-only tjenester
        ...(isAdminOrStaff ? {} : { isAdminOnly: false }),
      },
      include: {
        servicePrices: {
          include: {
            vehicleType: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Konverter Decimal til number for JSON serialisering
    const serializedServices = services.map(service => ({
      ...service,
      servicePrices: service.servicePrices.map(sp => ({
        ...sp,
        price: Number(sp.price),
      })),
    }))

    return NextResponse.json(serializedServices)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av tjenester' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Kun admin kan opprette tjenester
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, duration, category, prices, isAdminOnly } = body

    // Valider påkrevde felter
    if (!name || !description || !duration || !category) {
      return NextResponse.json(
        { error: 'Navn, beskrivelse, varighet og kategori er påkrevd' },
        { status: 400 }
      )
    }

    // Sjekk om navnet allerede eksisterer
    const existing = await prisma.service.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'En tjeneste med dette navnet eksisterer allerede' },
        { status: 400 }
      )
    }

    // Opprett tjeneste med priser i én transaksjon
    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration: Number(duration),
        category,
        isActive: true,
        isAdminOnly: isAdminOnly === true, // Standard false hvis ikke spesifisert
        servicePrices: {
          create: Object.entries(prices).map(([vehicleTypeId, price]) => ({
            vehicleTypeId,
            price: Number(price),
          })),
        },
      },
      include: {
        servicePrices: {
          include: {
            vehicleType: true,
          },
        },
      },
    })

    // Serialiser før returnering
    const serializedService = {
      ...service,
      servicePrices: service.servicePrices.map(sp => ({
        ...sp,
        price: Number(sp.price),
      })),
    }

    return NextResponse.json(serializedService, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette tjeneste' },
      { status: 500 }
    )
  }
}