import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    const { id } = await params
    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
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
      }
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Bestilling ikke funnet' },
        { status: 404 }
      )
    }

    // Hvis innlogget: sjekk at brukeren har tilgang til denne bestillingen
    // Hvis ikke innlogget: tillat tilgang (booking-ID er vanskelig å gjette)
    if (session && booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ingen tilgang' },
        { status: 403 }
      )
    }

    // Serialize Decimal to Number for client components
    const serializedBooking = {
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
    }

    return NextResponse.json(serializedBooking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { message: 'En feil oppstod' },
      { status: 500 }
    )
  }
}

