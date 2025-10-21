import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
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