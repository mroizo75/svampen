import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateCustomer, createInvoice, sendInvoice } from '@/lib/tripletex'

// POST - Opprett faktura fra booking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, sendToCustomer = true } = body

    if (!bookingId) {
      return NextResponse.json(
        { message: 'bookingId er påkrevd' },
        { status: 400 }
      )
    }

    // Hent booking med all nødvendig data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        company: true,
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

    // Sjekk om faktura allerede eksisterer
    const existingInvoice = await prisma.invoice.findFirst({
      where: { bookingId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { message: 'Faktura eksisterer allerede for denne bookingen' },
        { status: 400 }
      )
    }

    // Kun bedriftskunder skal få faktura til Tripletex
    if (!booking.company) {
      return NextResponse.json(
        { message: 'Kun bedriftskunder kan få faktura til Tripletex' },
        { status: 400 }
      )
    }

    const company = booking.company

    // 1. Opprett/hent kunde i Tripletex
    console.log('Creating/getting Tripletex customer...')
    const tripletexCustomerId = await getOrCreateCustomer({
      name: company.name,
      orgNumber: company.orgNumber || undefined,
      email: company.invoiceEmail || company.contactEmail,
      phone: company.contactPhone || undefined,
      invoiceEmail: company.invoiceEmail || company.contactEmail,
    })

    // 2. Bygg faktura-linjer
    const invoiceLines: Array<{
      description: string
      quantity: number
      unitPrice: number
    }> = []

    for (const vehicle of booking.bookingVehicles) {
      for (const bookingService of vehicle.bookingServices) {
        const description = `${bookingService.service.name} - ${vehicle.vehicleType.name}${
          vehicle.vehicleInfo ? ` (${vehicle.vehicleInfo})` : ''
        }`

        invoiceLines.push({
          description,
          quantity: bookingService.quantity,
          unitPrice: Number(bookingService.unitPrice),
        })
      }
    }

    // 3. Opprett faktura i Tripletex
    const invoiceDate = new Date()
    const dueDate = new Date()
    
    // Beregn forfallsdato basert på betalingsvilkår (standard: 30 dager)
    const paymentTermsDays = company.paymentTerms ? parseInt(company.paymentTerms) : 30
    dueDate.setDate(dueDate.getDate() + paymentTermsDays)

    console.log('Creating Tripletex invoice...')
    const tripletexInvoice = await createInvoice({
      customerId: tripletexCustomerId,
      invoiceDate,
      dueDate,
      lines: invoiceLines,
      remarks: booking.customerNotes || `Booking ${booking.id}`,
    })

    // 4. Generer fakturanummer
    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let nextNumber = 1
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }

    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, '0')}`

    // 5. Lagre faktura i database
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        invoiceNumber,
        tripletexId: tripletexInvoice.id,
        tripletexUrl: tripletexInvoice.url,
        tripletexVoucher: tripletexInvoice.voucherNumber,
        amount: Number(booking.totalPrice),
        taxAmount: Number(booking.totalPrice) * 0.2, // 20% av totalbeløp som MVA
        totalAmount: Number(booking.totalPrice),
        status: 'DRAFT',
        issuedDate: invoiceDate,
        dueDate,
        notes: booking.customerNotes || undefined,
      },
    })

    // 6. Send faktura til kunde hvis ønsket
    if (sendToCustomer) {
      console.log('Sending invoice to customer...')
      const sent = await sendInvoice(tripletexInvoice.id)
      
      if (sent) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'SENT',
            sentDate: new Date(),
          },
        })
      }
    }

    // 7. Oppdater booking payment status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PENDING',
        paymentMethod: 'invoice',
      },
    })

    return NextResponse.json({
      message: 'Faktura opprettet i Tripletex',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tripletexId: tripletexInvoice.id,
        tripletexUrl: tripletexInvoice.url,
        amount: invoice.totalAmount,
        status: invoice.status,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { 
        message: 'Feil ved opprettelse av faktura',
        error: String(error) 
      },
      { status: 500 }
    )
  }
}

