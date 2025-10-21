import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/bookings/[id]/complete - Marker booking som fullført og opprett faktura
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await req.json()
    const { 
      paymentMethod = 'invoice', 
      paymentStatus = 'UNPAID',
      sendInvoice = true,
      notes 
    } = data

    // Hent booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        bookingVehicles: {
          include: {
            vehicleType: true,
            bookingServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking ikke funnet' },
        { status: 404 }
      )
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Booking er allerede fullført' },
        { status: 400 }
      )
    }

    // Oppdater booking til fullført
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        paymentStatus,
        paymentMethod,
      },
    })

    let invoice = null

    // Opprett faktura hvis betalingsmetode er faktura og den ikke er betalt
    if (sendInvoice && paymentStatus !== 'PAID') {
      // Generer fakturanummer
      const year = new Date().getFullYear()
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: {
            startsWith: `INV-${year}-`,
          },
        },
        orderBy: {
          invoiceNumber: 'desc',
        },
      })

      let invoiceNumber
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
        invoiceNumber = `INV-${year}-${String(lastNumber + 1).padStart(4, '0')}`
      } else {
        invoiceNumber = `INV-${year}-0001`
      }

      // Beregn beløp
      const amount = Number(booking.totalPrice)
      const taxAmount = 0
      const totalAmount = amount + taxAmount

      // Sett forfallsdato (14 dager)
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

      // Opprett faktura
      invoice = await prisma.invoice.create({
        data: {
          bookingId: booking.id,
          invoiceNumber,
          amount,
          taxAmount,
          totalAmount,
          dueDate,
          notes,
          status: 'SENT',
        },
        include: {
          booking: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              bookingVehicles: {
                include: {
                  vehicleType: true,
                  bookingServices: {
                    include: {
                      service: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // Send faktura e-post hvis ønsket
      // TODO: Implementer e-post sending
      console.log(`Faktura ${invoiceNumber} opprettet for booking ${booking.id}`)
    }

    return NextResponse.json({
      booking: updatedBooking,
      invoice,
      message: 'Booking fullført' + (invoice ? ' og faktura sendt' : ''),
    })
  } catch (error) {
    console.error('Error completing booking:', error)
    return NextResponse.json(
      { message: 'Kunne ikke fullføre booking' },
      { status: 500 }
    )
  }
}

