import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateCustomer, createInvoice, sendInvoice, getInvoicePdfUrl } from '@/lib/tripletex'

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

    // 1. Opprett/hent kunde i Tripletex (både bedrift og privatkunde)
    console.log('Creating/getting Tripletex customer...')
    
    // Hvis bedriftskunde
    if (booking.company) {
      const company = booking.company
      var tripletexCustomerId = await getOrCreateCustomer({
        name: company.name,
        orgNumber: company.orgNumber || undefined,
        email: company.invoiceEmail || company.contactEmail,
        phone: company.contactPhone || undefined,
        invoiceEmail: company.invoiceEmail || company.contactEmail,
      })
    } 
    // Hvis privatkunde
    else {
      const user = booking.user
      var tripletexCustomerId = await getOrCreateCustomer({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || undefined,
        invoiceEmail: user.email,
      })
    }

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
    
    // Beregn forfallsdato basert på betalingsvilkår
    // Bedrift: bruk deres paymentTerms, Privat: 14 dager
    const paymentTermsDays = booking.company?.paymentTerms 
      ? parseInt(booking.company.paymentTerms) 
      : 14 // 14 dager for privatkunder
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

    // 5. Generer PDF URL fra Tripletex
    let pdfUrl: string | undefined
    try {
      pdfUrl = await getInvoicePdfUrl(tripletexInvoice.id)
    } catch (error) {
      console.error('Could not generate PDF URL:', error)
      // Continue without PDF URL
    }

    // 6. Lagre faktura i database
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        invoiceNumber,
        tripletexId: tripletexInvoice.id,
        tripletexUrl: tripletexInvoice.url,
        tripletexPdfUrl: pdfUrl,
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

    // 7. Send faktura til kunde hvis ønsket
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

    // 8. Oppdater booking payment status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'UNPAID',
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

