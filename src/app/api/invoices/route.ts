import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/invoices - Hent alle fakturaer (admin) eller brukerens fakturaer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Ikke autentisert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const bookingId = searchParams.get('bookingId')

    const whereClause: any = {}

    // Hvis ikke admin, vis bare brukerens egne fakturaer
    if (session.user.role !== 'ADMIN') {
      whereClause.booking = {
        userId: session.user.id,
      }
    }

    // Filtrer etter status hvis spesifisert
    if (status) {
      whereClause.status = status
    }

    // Filtrer etter booking hvis spesifisert
    if (bookingId) {
      whereClause.bookingId = bookingId
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { message: 'Kunne ikke hente fakturaer' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Opprett faktura for en booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const data = await req.json()
    const { bookingId, dueDate, notes } = data

    if (!bookingId) {
      return NextResponse.json(
        { message: 'Booking ID mangler' },
        { status: 400 }
      )
    }

    // Sjekk at booking eksisterer og er fullført
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking ikke funnet' },
        { status: 404 }
      )
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { message: 'Booking må være fullført før faktura kan opprettes' },
        { status: 400 }
      )
    }

    // Sjekk om det allerede eksisterer en faktura for denne bookingen
    const existingInvoice = await prisma.invoice.findFirst({
      where: { bookingId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { message: 'En faktura eksisterer allerede for denne bookingen', invoice: existingInvoice },
        { status: 200 }
      )
    }

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

    // Beregn beløp (kan inkludere MVA senere)
    const amount = Number(booking.totalPrice)
    const taxAmount = 0 // Kan legges til MVA-beregning her senere
    const totalAmount = amount + taxAmount

    // Sett forfallsdato (14 dager fra nå som standard)
    const calculatedDueDate = dueDate 
      ? new Date(dueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    // Opprett faktura
    const invoice = await prisma.invoice.create({
      data: {
        bookingId,
        invoiceNumber,
        amount,
        taxAmount,
        totalAmount,
        dueDate: calculatedDueDate,
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

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { message: 'Kunne ikke opprette faktura' },
      { status: 500 }
    )
  }
}

