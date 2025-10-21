import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/invoices/[id] - Hent en spesifikk faktura
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Ikke autentisert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
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

    if (!invoice) {
      return NextResponse.json(
        { message: 'Faktura ikke funnet' },
        { status: 404 }
      )
    }

    // Sjekk tilgang: admin eller eier av booking
    if (
      session.user.role !== 'ADMIN' &&
      invoice.booking.userId !== session.user.id
    ) {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    // Serialize Decimal to Number for client components
    const serializedInvoice = {
      ...invoice,
      amount: Number(invoice.amount),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      booking: {
        ...invoice.booking,
        totalPrice: Number(invoice.booking.totalPrice),
        bookingVehicles: invoice.booking.bookingVehicles.map(vehicle => ({
          ...vehicle,
          bookingServices: vehicle.bookingServices.map(service => ({
            ...service,
            unitPrice: Number(service.unitPrice),
            totalPrice: Number(service.totalPrice),
          })),
        })),
      },
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { message: 'Kunne ikke hente faktura' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[id] - Oppdater faktura status
export async function PATCH(
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
    const { status, paymentMethod, adminNotes } = data

    const updateData: any = {}

    if (status) {
      updateData.status = status
      
      // Hvis status settes til PAID, sett paidDate og oppdater booking
      if (status === 'PAID') {
        updateData.paidDate = new Date()
      }
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        booking: true,
      },
    })

    // Oppdater booking paymentStatus hvis faktura er betalt
    if (status === 'PAID') {
      await prisma.booking.update({
        where: { id: invoice.bookingId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod || 'invoice',
        },
      })
    }

    // Serialize Decimal to Number for client components
    const serializedInvoice = {
      ...invoice,
      amount: Number(invoice.amount),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      booking: invoice.booking ? {
        ...invoice.booking,
        totalPrice: Number(invoice.booking.totalPrice),
      } : invoice.booking,
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { message: 'Kunne ikke oppdatere faktura' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Slett faktura (kun admin)
export async function DELETE(
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
    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Faktura slettet' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { message: 'Kunne ikke slette faktura' },
      { status: 500 }
    )
  }
}

