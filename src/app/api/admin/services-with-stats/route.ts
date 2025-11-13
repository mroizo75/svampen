import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const services = await prisma.service.findMany({
      include: {
        servicePrices: {
          include: {
            vehicleType: true,
          },
        },
        bookingServices: {
          include: {
            bookingVehicle: {
              include: {
                booking: {
                  select: {
                    id: true,
                    status: true,
                    totalPrice: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Beregn statistikk for hver tjeneste
    const servicesWithStats = services.map(service => {
      // Hent unike bookings (siden samme booking kan ha flere tjenester)
      const bookingMap = new Map()
      service.bookingServices.forEach(bs => {
        const booking = bs.bookingVehicle.booking
        if (!bookingMap.has(booking.id)) {
          bookingMap.set(booking.id, booking)
        }
      })
      
      const uniqueBookings = Array.from(bookingMap.values())
      const totalBookings = uniqueBookings.length
      const completedBookings = uniqueBookings.filter((b: any) => b.status === 'COMPLETED').length
      
      // For omsetning, beregn basert på denne tjenestens prisbidrag
      const totalRevenue = service.bookingServices
        .filter(bs => bs.bookingVehicle.booking.status === 'COMPLETED')
        .reduce((sum, bs) => sum + Number(bs.totalPrice), 0)

      return {
        ...service,
        servicePrices: service.servicePrices.map(sp => ({
          ...sp,
          price: Number(sp.price),
        })),
        stats: {
          totalBookings,
          completedBookings,
          totalRevenue,
        },
      }
    })

    return NextResponse.json(servicesWithStats)
  } catch (error) {
    console.error('Error fetching services with stats:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av tjenester' },
      { status: 500 }
    )
  }
}

