import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendInvoiceEmail } from '@/lib/email'

// POST /api/invoices/[id]/resend - Send faktura på nytt
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
    
    // Hent faktura med all nødvendig data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
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
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Faktura ikke funnet' },
        { status: 404 }
      )
    }

    // Forbered data for e-post
    const emailData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: `${invoice.booking.user.firstName} ${invoice.booking.user.lastName}`,
      customerEmail: invoice.booking.user.email,
      bookingId: invoice.booking.id,
      amount: Number(invoice.amount),
      totalAmount: Number(invoice.totalAmount),
      dueDate: invoice.dueDate.toISOString(),
      issuedDate: invoice.issuedDate.toISOString(),
      vehicles: invoice.booking.bookingVehicles.map(vehicle => ({
        vehicleType: vehicle.vehicleType.name,
        services: vehicle.bookingServices.map(bs => ({
          name: bs.service.name,
          price: Number(bs.totalPrice),
        })),
      })),
    }

    // Send e-post
    const emailResult = await sendInvoiceEmail(emailData)

    if (!emailResult.success) {
      console.error('Failed to resend invoice email:', emailResult.error)
      return NextResponse.json(
        { message: 'Kunne ikke sende faktura e-post', error: emailResult.error },
        { status: 500 }
      )
    }

    // Oppdater faktura status til SENT hvis den var DRAFT
    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'SENT' },
      })
    }

    console.log(`✅ Faktura ${invoice.invoiceNumber} sendt på nytt til ${invoice.booking.user.email}`)

    return NextResponse.json({
      message: 'Faktura sendt på nytt',
      invoice,
      emailSent: true,
    })
  } catch (error) {
    console.error('Error resending invoice:', error)
    return NextResponse.json(
      { message: 'Kunne ikke sende faktura på nytt' },
      { status: 500 }
    )
  }
}

