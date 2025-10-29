import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyBookingUpdate } from '@/lib/sse-notifications'

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

// PATCH /api/bookings/[id] - Oppdater booking (avbestilling/statusendring)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: 'Du må være logget inn' },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()
    const { status, adminNotes } = data

    // Hent booking først
    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Bestilling ikke funnet' },
        { status: 404 }
      )
    }

    // Sjekk tilgang
    const isOwner = booking.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Ingen tilgang til denne bestillingen' },
        { status: 403 }
      )
    }

    // Valider statusendring
    if (status) {
      // Brukere kan kun avbestille sine egne bookinger
      if (!isAdmin && status !== 'CANCELLED') {
        return NextResponse.json(
          { message: 'Du kan kun avbestille bookinger' },
          { status: 403 }
        )
      }

      // Ikke tillat endring av allerede avbestilte/fullførte bookinger for vanlige brukere
      if (!isAdmin && ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
        return NextResponse.json(
          { message: 'Denne bestillingen kan ikke endres' },
          { status: 400 }
        )
      }

      // Sjekk om bookingen er i fortiden (kun for brukere, admin kan endre hva som helst)
      if (!isAdmin && new Date(booking.scheduledDate) < new Date()) {
        return NextResponse.json(
          { message: 'Du kan ikke avbestille en booking som allerede har vært' },
          { status: 400 }
        )
      }
    }

    // Bygg update-objektet
    const updateData: any = {}
    if (status) updateData.status = status
    
    // Oppdater booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
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

    // Serialize for client
    const serializedBooking = {
      ...updatedBooking,
      totalPrice: Number(updatedBooking.totalPrice),
      bookingVehicles: updatedBooking.bookingVehicles.map(vehicle => ({
        ...vehicle,
        bookingServices: vehicle.bookingServices.map(service => ({
          ...service,
          unitPrice: Number(service.unitPrice),
          totalPrice: Number(service.totalPrice),
        })),
      })),
    }

    // Notify SSE clients about booking update
    notifyBookingUpdate()

    return NextResponse.json({
      message: status === 'CANCELLED' ? 'Bestilling avbestilt' : 'Bestilling oppdatert',
      booking: serializedBooking
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { message: 'Kunne ikke oppdatere bestilling' },
      { status: 500 }
    )
  }
}

