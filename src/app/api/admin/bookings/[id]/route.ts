import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { BookingStatus, Prisma } from '@prisma/client'

class BookingUpdateError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const bookingIncludes = {
  user: true,
  company: true,
  bookingVehicles: {
    include: {
      vehicleType: true,
      bookingServices: {
        include: { service: true },
      },
    },
  },
}

type AddedServiceInput = {
  bookingVehicleId: string
  serviceId: string
  quantity?: number
}

async function applyServiceAdditions(
  bookingId: string,
  additions: AddedServiceInput[],
  bookingVehicles: Array<{ id: string; vehicleTypeId: string }>
) {
  if (additions.length === 0) {
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const addition of additions) {
      const bookingVehicle = bookingVehicles.find((vehicle) => vehicle.id === addition.bookingVehicleId)
      if (!bookingVehicle) {
        throw new BookingUpdateError('Kjøretøyet tilhører ikke denne bestillingen', 400)
      }

      const quantity = addition.quantity && addition.quantity > 0 ? Math.floor(addition.quantity) : 1

      const servicePrice = await tx.servicePrice.findUnique({
        where: {
          serviceId_vehicleTypeId: {
            serviceId: addition.serviceId,
            vehicleTypeId: bookingVehicle.vehicleTypeId,
          },
        },
        include: {
          service: true,
        },
      })

      if (!servicePrice || !servicePrice.service) {
        throw new BookingUpdateError('Tjenesten er ikke priset for valgt kjøretøy', 400)
      }

      const existingService = await tx.bookingService.findFirst({
        where: {
          bookingVehicleId: bookingVehicle.id,
          serviceId: addition.serviceId,
        },
      })

      if (existingService) {
        const newQuantity = existingService.quantity + quantity
        const unitPriceDecimal = new Prisma.Decimal(existingService.unitPrice)

        await tx.bookingService.update({
          where: { id: existingService.id },
          data: {
            quantity: newQuantity,
            totalPrice: unitPriceDecimal.mul(newQuantity),
          },
        })
      } else {
        const unitPriceDecimal = new Prisma.Decimal(servicePrice.price)

        await tx.bookingService.create({
          data: {
            bookingVehicleId: bookingVehicle.id,
            serviceId: addition.serviceId,
            quantity,
            unitPrice: unitPriceDecimal,
            totalPrice: unitPriceDecimal.mul(quantity),
            duration: servicePrice.service.duration,
          },
        })
      }
    }

    const bookingRecord = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        scheduledTime: true,
      },
    })

    if (!bookingRecord) {
      throw new BookingUpdateError('Bestilling ikke funnet under oppdatering', 404)
    }

    const bookingServices = await tx.bookingService.findMany({
      where: {
        bookingVehicle: {
          bookingId,
        },
      },
      select: {
        duration: true,
        quantity: true,
        totalPrice: true,
      },
    })

    const totalDuration = bookingServices.reduce(
      (sum, service) => sum + service.duration * service.quantity,
      0
    )

    const totalPrice = bookingServices.reduce(
      (sum, service) => sum.add(service.totalPrice),
      new Prisma.Decimal(0)
    )

    const estimatedEnd = new Date(bookingRecord.scheduledTime.getTime() + totalDuration * 60000)

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        totalDuration,
        totalPrice,
        estimatedEnd,
      },
    })
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { scheduledDate, scheduledTime, status, customerNotes, sendNotification, addedServices } = body as {
      scheduledDate?: string
      scheduledTime?: string
      status?: BookingStatus
      customerNotes?: string
      sendNotification?: boolean
      addedServices?: AddedServiceInput[]
    }

    let booking = await prisma.booking.findUnique({
      where: { id },
      include: bookingIncludes,
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Bestilling ikke funnet' },
        { status: 404 }
      )
    }

    const bookingBeforeUpdates = booking
    const additions = Array.isArray(addedServices) ? addedServices : []

    if (additions.some((service) => !service.bookingVehicleId || !service.serviceId)) {
      throw new BookingUpdateError('Ugyldig tjenestedata for tjenester', 400)
    }

    if (additions.length > 0) {
      await applyServiceAdditions(
        id,
        additions,
        booking.bookingVehicles.map((vehicle) => ({
          id: vehicle.id,
          vehicleTypeId: vehicle.vehicleTypeId,
        }))
      )

      const refreshedBooking = await prisma.booking.findUnique({
        where: { id },
        include: bookingIncludes,
      })

      if (!refreshedBooking) {
        throw new BookingUpdateError('Bestilling ikke funnet etter oppdatering', 404)
      }

      booking = refreshedBooking
    }

    // Sjekk om dato/tid endres
    const dateChanged = scheduledDate && scheduledDate !== bookingBeforeUpdates.scheduledDate.toISOString().split('T')[0]
    const timeChanged = scheduledTime && scheduledTime !== new Date(bookingBeforeUpdates.scheduledTime).toTimeString().slice(0, 5)

    if (dateChanged || timeChanged) {
      // Valider ny dato/tid
      const newDate = scheduledDate || bookingBeforeUpdates.scheduledDate.toISOString().split('T')[0]
      const newTime = scheduledTime || new Date(bookingBeforeUpdates.scheduledTime).toTimeString().slice(0, 5)
      
      // Kombiner dato og tid (lokaltid, ikke UTC)
      // Parse som lokal tid ved å bruke Date constructor med separate verdier
      const [year, month, day] = newDate.split('-').map(Number)
      const [hours, minutes] = newTime.split(':').map(Number)
      const scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0)
      const estimatedEnd = new Date(scheduledDateTime.getTime() + booking.totalDuration * 60000)

      // Sjekk for overlappende bookinger (unntatt denne bookingen)
      // PENDING, CONFIRMED, IN_PROGRESS blokkerer. CANCELLED, COMPLETED, NO_SHOW teller ikke.
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          id: { not: id },
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
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
          { 
            message: 'Det valgte tidspunktet er ikke tilgjengelig. Det overlapper med en annen booking.',
            overlappingBookings: overlappingBookings.map(b => ({
              id: b.id,
              time: b.scheduledTime,
            }))
          },
          { status: 409 }
        )
      }

      // Oppdater booking med ny dato/tid
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          scheduledDate: new Date(newDate),
          scheduledTime: scheduledDateTime,
          estimatedEnd: estimatedEnd,
          status: status || booking.status,
          customerNotes: customerNotes !== undefined ? customerNotes : booking.customerNotes,
        },
        include: {
          ...bookingIncludes,
        },
      })

      // Send varsling hvis forespurt
      if (sendNotification) {
        const oldDateTime = `${bookingBeforeUpdates.scheduledDate.toLocaleDateString('nb-NO')} kl. ${new Date(bookingBeforeUpdates.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
        const newDateTime = `${updatedBooking.scheduledDate.toLocaleDateString('nb-NO')} kl. ${new Date(updatedBooking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`

        await sendEmail({
          to: updatedBooking.user.email,
          subject: 'Din bestilling har blitt flyttet',
          html: `
            <h1>Bestillingen din har blitt flyttet</h1>
            <p>Hei ${updatedBooking.user.firstName},</p>
            <p>Din bestilling har blitt flyttet til et nytt tidspunkt:</p>
            <ul>
              <li><strong>Gammelt tidspunkt:</strong> ${oldDateTime}</li>
              <li><strong>Nytt tidspunkt:</strong> ${newDateTime}</li>
            </ul>
            <p>Hvis du har spørsmål, ta kontakt med oss.</p>
            <p>Med vennlig hilsen,<br>Svampen</p>
          `,
        })
      }

      return NextResponse.json({
        message: 'Bestilling oppdatert',
        booking: updatedBooking,
      })
    }

    // Hvis kun status eller merknader endres
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: status || booking.status,
        customerNotes: customerNotes !== undefined ? customerNotes : booking.customerNotes,
      },
      include: {
        ...bookingIncludes,
      },
    })

    // Send varsling om statusendring hvis forespurt
    if (sendNotification && status && status !== bookingBeforeUpdates.status) {
      const statusTextMap: Record<BookingStatus, string> = {
        PENDING: 'venter',
        CONFIRMED: 'bekreftet',
        IN_PROGRESS: 'pågår',
        COMPLETED: 'fullført',
        CANCELLED: 'kansellert',
        NO_SHOW: 'ikke møtt',
      }
      const statusText = statusTextMap[status] || status

      await sendEmail({
        to: updatedBooking.user.email,
        subject: 'Statusoppdatering for din bestilling',
        html: `
          <h1>Statusoppdatering</h1>
          <p>Hei ${updatedBooking.user.firstName},</p>
          <p>Statusen for din bestilling har blitt oppdatert til: <strong>${statusText}</strong></p>
          <p>Tidspunkt: ${updatedBooking.scheduledDate.toLocaleDateString('nb-NO')} kl. ${new Date(updatedBooking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</p>
          ${customerNotes ? `<p><strong>Merknad:</strong> ${customerNotes}</p>` : ''}
          <p>Med vennlig hilsen,<br>Svampen</p>
        `,
      })
    }

    return NextResponse.json({
      message: 'Bestilling oppdatert',
      booking: updatedBooking,
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    if (error instanceof BookingUpdateError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { message: 'Kunne ikke oppdatere bestilling' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Hent booking først
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        invoices: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Bestilling ikke funnet' },
        { status: 404 }
      )
    }

    // Ikke slett hvis det finnes fakturaer
    if (booking.invoices.length > 0) {
      return NextResponse.json(
        { message: 'Kan ikke slette bestilling med eksisterende fakturaer. Kanseller i stedet.' },
        { status: 400 }
      )
    }

    // Slett booking (cascade vil slette relaterte poster)
    await prisma.booking.delete({
      where: { id },
    })

    // Send varsel til kunde
    await sendEmail({
      to: booking.user.email,
      subject: 'Din bestilling har blitt kansellert',
      html: `
        <h1>Bestilling kansellert</h1>
        <p>Hei ${booking.user.firstName},</p>
        <p>Din bestilling for ${booking.scheduledDate.toLocaleDateString('nb-NO')} har blitt kansellert.</p>
        <p>Hvis du har spørsmål, ta kontakt med oss.</p>
        <p>Med vennlig hilsen,<br>Svampen</p>
      `,
    })

    return NextResponse.json({
      message: 'Bestilling slettet',
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { message: 'Kunne ikke slette bestilling' },
      { status: 500 }
    )
  }
}

