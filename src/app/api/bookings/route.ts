import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DEPRECATED: This POST endpoint is no longer used. 
 * All bookings now go through /api/multi-bookings
 * Keeping this file only for the GET endpoint
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Du må være logget inn' },
        { status: 401 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        bookingVehicles: {
          include: {
            vehicleType: true,
            bookingServices: {
              include: {
                service: true,
              }
            }
          }
        }
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    })

    // Serialize Decimal to Number for client components
    const serializedBookings = bookings.map(booking => ({
      ...booking,
      totalPrice: Number(booking.totalPrice),
      bookingVehicles: booking.bookingVehicles.map(vehicle => ({
        ...vehicle,
        bookingServices: vehicle.bookingServices.map(service => ({
          ...service,
          unitPrice: Number(service.unitPrice),
          totalPrice: Number(service.totalPrice),
        })),
      })),
    }))

    return NextResponse.json(serializedBookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av bestillinger' },
      { status: 500 }
    )
  }
}