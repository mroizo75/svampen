import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyBookingUpdate } from '@/lib/sse-notifications'
import { sendEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Krever autentisering for å se booking-detaljer
    if (!session) {
      return NextResponse.json(
        { message: 'Du må være logget inn for å se bestillingsdetaljer' },
        { status: 401 }
      )
    }

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

    // Sjekk at brukeren har tilgang til denne bestillingen
    if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
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

// PATCH /api/bookings/[id] - Oppdater booking (avbestilling/statusendring/kunde-redigering)
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
    const { status, adminNotes, scheduledDate, scheduledTime, customerNotes } = data

    const booking = await prisma.booking.findUnique({
      where: { id },
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
            bookingServices: { include: { service: true } },
          }
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Bestilling ikke funnet' },
        { status: 404 }
      )
    }

    const isOwner = booking.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Ingen tilgang til denne bestillingen' },
        { status: 403 }
      )
    }

    // Kunde-redigering: dato, tid eller merknader
    const isCustomerReschedule = isOwner && !isAdmin && (scheduledDate || scheduledTime || customerNotes !== undefined)

    if (isCustomerReschedule) {
      if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
        return NextResponse.json(
          { message: 'Denne bestillingen kan ikke endres' },
          { status: 400 }
        )
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      if (new Date(booking.scheduledDate) < todayStart) {
        return NextResponse.json(
          { message: 'Du kan ikke endre en bestilling som allerede har vært' },
          { status: 400 }
        )
      }

      const newDateStr = scheduledDate ?? booking.scheduledDate.toISOString().split('T')[0]
      const currentTimeStr = new Date(booking.scheduledTime).toTimeString().slice(0, 5)
      const newTimeStr = scheduledTime ?? currentTimeStr
      const dateChanged = scheduledDate && scheduledDate !== booking.scheduledDate.toISOString().split('T')[0]
      const timeChanged = scheduledTime && scheduledTime !== currentTimeStr

      if (dateChanged || timeChanged) {
        const minAdvanceSetting = await prisma.adminSettings.findUnique({
          where: { key: 'min_advance_booking_hours' },
        })
        const minAdvanceHours = minAdvanceSetting ? parseInt(minAdvanceSetting.value, 10) : 24
        const minimumBookingTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)

        const [year, month, day] = newDateStr.split('-').map(Number)
        const [hours, minutes] = newTimeStr.split(':').map(Number)
        const scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0)
        const estimatedEnd = new Date(scheduledDateTime.getTime() + booking.totalDuration * 60000)

        if (scheduledDateTime < minimumBookingTime) {
          return NextResponse.json(
            { message: `Bestilling må gjøres minst ${minAdvanceHours} timer i forveien` },
            { status: 400 }
          )
        }

        const overlappingBookings = await prisma.booking.findMany({
          where: {
            id: { not: id },
            status: { notIn: ['CANCELLED', 'COMPLETED'] },
            OR: [
              {
                AND: [
                  { scheduledTime: { lte: scheduledDateTime } },
                  { estimatedEnd: { gt: scheduledDateTime } },
                ],
              },
              {
                AND: [
                  { scheduledTime: { lt: estimatedEnd } },
                  { estimatedEnd: { gte: estimatedEnd } },
                ],
              },
              {
                AND: [
                  { scheduledTime: { gte: scheduledDateTime } },
                  { estimatedEnd: { lte: estimatedEnd } },
                ],
              },
            ],
          },
        })

        if (overlappingBookings.length > 0) {
          return NextResponse.json(
            { message: 'Det valgte tidspunktet er ikke tilgjengelig' },
            { status: 409 }
          )
        }

        const updatedBooking = await prisma.booking.update({
          where: { id },
          data: {
            scheduledDate: new Date(newDateStr),
            scheduledTime: scheduledDateTime,
            estimatedEnd,
            customerNotes: customerNotes !== undefined ? customerNotes : booking.customerNotes,
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

        const oldDateTime = `${booking.scheduledDate.toLocaleDateString('nb-NO')} kl. ${new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
        const newDateTime = `${updatedBooking.scheduledDate.toLocaleDateString('nb-NO')} kl. ${new Date(updatedBooking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`

        await sendEmail({
          to: updatedBooking.user.email,
          subject: 'Din bestilling har blitt endret',
          html: `
            <h1>Bestillingen din har blitt endret</h1>
            <p>Hei ${updatedBooking.user.firstName},</p>
            <p>Din bestilling har blitt endret:</p>
            <ul>
              <li><strong>Tidligere:</strong> ${oldDateTime}</li>
              <li><strong>Nytt tidspunkt:</strong> ${newDateTime}</li>
            </ul>
            <p>Med vennlig hilsen,<br>Svampen</p>
          `,
        })

        notifyBookingUpdate()

        return NextResponse.json({
          message: 'Bestilling oppdatert',
          booking: serializeBooking(updatedBooking),
        })
      }

      if (customerNotes !== undefined) {
        const updatedBooking = await prisma.booking.update({
          where: { id },
          data: { customerNotes },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            bookingVehicles: {
              include: {
                vehicleType: true,
                bookingServices: { include: { service: true } },
              }
            }
          }
        })
        notifyBookingUpdate()
        return NextResponse.json({
          message: 'Bestilling oppdatert',
          booking: serializeBooking(updatedBooking),
        })
      }

      return NextResponse.json({
        message: 'Ingen endringer',
        booking: serializeBooking(booking),
      })
    }

    // Statusendring (avbestilling / admin)
    if (status) {
      if (!isAdmin && status !== 'CANCELLED') {
        return NextResponse.json(
          { message: 'Du kan kun avbestille bookinger' },
          { status: 403 }
        )
      }

      if (!isAdmin && ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
        return NextResponse.json(
          { message: 'Denne bestillingen kan ikke endres' },
          { status: 400 }
        )
      }

      if (!isAdmin && new Date(booking.scheduledDate) < new Date()) {
        return NextResponse.json(
          { message: 'Du kan ikke avbestille en booking som allerede har vært' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (isAdmin && adminNotes !== undefined) updateData.adminNotes = adminNotes

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

    notifyBookingUpdate()

    return NextResponse.json({
      message: status === 'CANCELLED' ? 'Bestilling avbestilt' : 'Bestilling oppdatert',
      booking: serializeBooking(updatedBooking),
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { message: 'Kunne ikke oppdatere bestilling' },
      { status: 500 }
    )
  }
}

function serializeBooking(
  booking: {
    totalPrice: unknown
    bookingVehicles: Array<{
      bookingServices: Array<{ unitPrice: unknown; totalPrice: unknown; [key: string]: unknown }>
      [key: string]: unknown
    }>
    [key: string]: unknown
  } | null
) {
  if (!booking) return null
  return {
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
}

