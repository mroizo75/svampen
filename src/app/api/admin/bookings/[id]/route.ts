import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { BookingStatus } from '@prisma/client'

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
    const { scheduledDate, scheduledTime, status, customerNotes, sendNotification } = body as {
      scheduledDate?: string
      scheduledTime?: string
      status?: BookingStatus
      customerNotes?: string
      sendNotification?: boolean
    }

    // Hent eksisterende booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
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
      },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { message: 'Bestilling ikke funnet' },
        { status: 404 }
      )
    }

    // Sjekk om dato/tid endres
    const dateChanged = scheduledDate && scheduledDate !== existingBooking.scheduledDate.toISOString().split('T')[0]
    const timeChanged = scheduledTime && scheduledTime !== new Date(existingBooking.scheduledTime).toTimeString().slice(0, 5)

    if (dateChanged || timeChanged) {
      // Valider ny dato/tid
      const newDate = scheduledDate || existingBooking.scheduledDate.toISOString().split('T')[0]
      const newTime = scheduledTime || new Date(existingBooking.scheduledTime).toTimeString().slice(0, 5)
      
      // Kombiner dato og tid (lokaltid, ikke UTC)
      // Parse som lokal tid ved å bruke Date constructor med separate verdier
      const [year, month, day] = newDate.split('-').map(Number)
      const [hours, minutes] = newTime.split(':').map(Number)
      const scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0)
      const estimatedEnd = new Date(scheduledDateTime.getTime() + existingBooking.totalDuration * 60000)

      // Sjekk for overlappende bookinger (unntatt denne bookingen)
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
          status: status || existingBooking.status,
          customerNotes: customerNotes !== undefined ? customerNotes : existingBooking.customerNotes,
        },
        include: {
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
        },
      })

      // Send varsling hvis forespurt
      if (sendNotification) {
        const oldDateTime = `${existingBooking.scheduledDate.toLocaleDateString('nb-NO')} kl. ${new Date(existingBooking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
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
        status: status || existingBooking.status,
        customerNotes: customerNotes !== undefined ? customerNotes : existingBooking.customerNotes,
      },
      include: {
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
      },
    })

    // Send varsling om statusendring hvis forespurt
    if (sendNotification && status && status !== existingBooking.status) {
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

