import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateCustomer, createInvoice as createTripletexInvoice, sendInvoice, getInvoicePdfUrl } from '@/lib/tripletex'
import { notifyBookingUpdate } from '@/lib/sse-notifications'

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

    // Hent booking med company info
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        company: true,
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

    // Opprett faktura i Tripletex hvis betalingsmetode er faktura og den ikke er betalt
    if (sendInvoice && paymentStatus !== 'PAID') {
      try {
        console.log('📄 Oppretter faktura i Tripletex...')

        // 1. Opprett/hent kunde i Tripletex (både bedrift og privatkunde)
        let tripletexCustomerId: number
        
        if (booking.company) {
          // Bedriftskunde
          const company = booking.company
          tripletexCustomerId = await getOrCreateCustomer({
            name: company.name,
            orgNumber: company.orgNumber || undefined,
            email: company.invoiceEmail || company.contactEmail,
            phone: company.contactPhone || undefined,
            invoiceEmail: company.invoiceEmail || company.contactEmail,
          })
        } else {
          // Privatkunde
          const user = booking.user
          tripletexCustomerId = await getOrCreateCustomer({
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
        const paymentTermsDays = booking.company?.paymentTerms 
          ? parseInt(booking.company.paymentTerms) 
          : 14 // 14 dager for privatkunder
        dueDate.setDate(dueDate.getDate() + paymentTermsDays)

        const tripletexInvoice = await createTripletexInvoice({
          customerId: tripletexCustomerId,
          invoiceDate,
          dueDate,
          lines: invoiceLines,
          remarks: booking.customerNotes || undefined,
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

        // 5. Generer PDF URL
        let pdfUrl: string | undefined
        try {
          pdfUrl = await getInvoicePdfUrl(tripletexInvoice.id)
        } catch (error) {
          console.error('Could not generate PDF URL:', error)
        }

        // 6. Lagre faktura i database
        invoice = await prisma.invoice.create({
          data: {
            bookingId: booking.id,
            invoiceNumber,
            tripletexId: tripletexInvoice.id,
            tripletexUrl: tripletexInvoice.url,
            tripletexPdfUrl: pdfUrl,
            tripletexVoucher: tripletexInvoice.voucherNumber,
            amount: Number(booking.totalPrice),
            taxAmount: Number(booking.totalPrice) * 0.2,
            totalAmount: Number(booking.totalPrice),
            status: 'DRAFT',
            issuedDate: invoiceDate,
            dueDate,
            notes,
          },
        })

        // 7. Send faktura til kunde
        console.log('📧 Sender faktura til kunde...')
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

        console.log(`✅ Faktura ${invoiceNumber} opprettet i Tripletex (ID: ${tripletexInvoice.id})`)
      } catch (error) {
        console.error('❌ Feil ved opprettelse av Tripletex-faktura:', error)
        // Continue even if invoice creation fails
      }
    }

    // Notify SSE clients about booking completion
    notifyBookingUpdate()

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

