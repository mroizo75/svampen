import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// GET /api/invoices/[id]/download - Last ned faktura som PDF
export async function GET(
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

    // Hent faktura med booking info
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
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
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Faktura ikke funnet' },
        { status: 404 }
      )
    }

    // Hvis vi har Tripletex PDF URL, bruk den
    if (invoice.tripletexPdfUrl) {
      return NextResponse.redirect(invoice.tripletexPdfUrl)
    }

    // Generer PDF lokalt
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()

    // --- HEADER ---
    pdf.setFontSize(24)
    pdf.setTextColor(37, 99, 235) // Blue
    pdf.text('FAKTURA', 20, 25)

    // Logo placeholder (kan legges til senere)
    pdf.setFontSize(10)
    pdf.setTextColor(100)
    pdf.text('Svampen AS', 20, 35)
    pdf.text('Org.nr: 123456789', 20, 40)
    pdf.text('svampen@example.com', 20, 45)
    pdf.text('Tlf: +47 123 45 678', 20, 50)

    // Fakturanummer og dato (høyre side)
    pdf.setFontSize(12)
    pdf.setTextColor(0)
    pdf.text(`Fakturanr: ${invoice.invoiceNumber}`, pageWidth - 20, 35, { align: 'right' })
    pdf.text(`Dato: ${new Date(invoice.issuedDate).toLocaleDateString('nb-NO')}`, pageWidth - 20, 41, { align: 'right' })
    pdf.text(`Forfall: ${new Date(invoice.dueDate).toLocaleDateString('nb-NO')}`, pageWidth - 20, 47, { align: 'right' })

    // --- KUNDE INFO ---
    pdf.setFontSize(12)
    pdf.setTextColor(0)
    pdf.text('Til:', 20, 65)
    
    let yPos = 72
    if (invoice.booking.company) {
      // Bedriftskunde
      pdf.setFont('helvetica', 'bold')
      pdf.text(invoice.booking.company.name, 20, yPos)
      pdf.setFont('helvetica', 'normal')
      yPos += 6
      
      if (invoice.booking.company.orgNumber) {
        pdf.text(`Org.nr: ${invoice.booking.company.orgNumber}`, 20, yPos)
        yPos += 6
      }
      
      if (invoice.booking.company.address) {
        pdf.text(invoice.booking.company.address, 20, yPos)
        yPos += 6
      }
      
      pdf.text(invoice.booking.company.contactEmail, 20, yPos)
    } else {
      // Privatkunde
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${invoice.booking.user.firstName} ${invoice.booking.user.lastName}`, 20, yPos)
      pdf.setFont('helvetica', 'normal')
      yPos += 6
      
      pdf.text(invoice.booking.user.email, 20, yPos)
      yPos += 6
      
      if (invoice.booking.user.phone) {
        pdf.text(invoice.booking.user.phone, 20, yPos)
      }
    }

    // --- FAKTURA LINJER (TABELL) ---
    const tableStartY = yPos + 15
    
    const tableData = []
    
    for (const vehicle of invoice.booking.bookingVehicles) {
      for (const bookingService of vehicle.bookingServices) {
        const description = `${bookingService.service.name} - ${vehicle.vehicleType.name}${
          vehicle.vehicleInfo ? ` (${vehicle.vehicleInfo})` : ''
        }`
        
        tableData.push([
          description,
          bookingService.quantity.toString(),
          `${Number(bookingService.unitPrice).toLocaleString('nb-NO')} kr`,
          `${(bookingService.quantity * Number(bookingService.unitPrice)).toLocaleString('nb-NO')} kr`
        ])
      }
    }

    autoTable(pdf, {
      startY: tableStartY,
      head: [['Beskrivelse', 'Antall', 'Pris', 'Totalt']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    })

    // @ts-ignore - autoTable adds finalY to pdf
    const tableEndY = pdf.lastAutoTable.finalY || tableStartY + 40

    // --- TOTALER ---
    const rightAlign = pageWidth - 20
    const leftAlign = rightAlign - 50

    let totalY = tableEndY + 15

    pdf.setFontSize(11)
    
    // Subtotal (eksl. MVA)
    pdf.text('Subtotal (eksl. MVA):', leftAlign, totalY, { align: 'right' })
    pdf.text(`${Number(invoice.amount).toLocaleString('nb-NO')} kr`, rightAlign, totalY, { align: 'right' })
    totalY += 7

    // MVA (25%)
    pdf.text('MVA (25%):', leftAlign, totalY, { align: 'right' })
    pdf.text(`${Number(invoice.taxAmount).toLocaleString('nb-NO')} kr`, rightAlign, totalY, { align: 'right' })
    totalY += 10

    // Total
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Totalt å betale:', leftAlign, totalY, { align: 'right' })
    pdf.text(`${Number(invoice.totalAmount).toLocaleString('nb-NO')} kr`, rightAlign, totalY, { align: 'right' })
    pdf.setFont('helvetica', 'normal')

    // --- BETALINGSINFORMASJON ---
    totalY += 20
    pdf.setFontSize(11)
    pdf.setTextColor(100)
    pdf.text('Betalingsinformasjon:', 20, totalY)
    totalY += 7
    pdf.text('Kontonummer: 1234 56 78901', 20, totalY)
    totalY += 6
    pdf.text(`KID: ${invoice.invoiceNumber}`, 20, totalY)
    totalY += 6
    pdf.text(`Forfallsdato: ${new Date(invoice.dueDate).toLocaleDateString('nb-NO')}`, 20, totalY)

    // --- MERKNAD ---
    if (invoice.notes || invoice.booking.customerNotes) {
      totalY += 15
      pdf.setTextColor(0)
      pdf.text('Merknad:', 20, totalY)
      totalY += 7
      pdf.setFontSize(10)
      pdf.text(invoice.notes || invoice.booking.customerNotes || '', 20, totalY, { maxWidth: pageWidth - 40 })
    }

    // --- FOOTER ---
    const footerY = pdf.internal.pageSize.getHeight() - 20
    pdf.setFontSize(9)
    pdf.setTextColor(150)
    pdf.text('Takk for at du valgte Svampen!', pageWidth / 2, footerY, { align: 'center' })
    pdf.text('www.svampen.no', pageWidth / 2, footerY + 5, { align: 'center' })

    // Generer PDF som buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Send PDF som response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Faktura_${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { message: 'Kunne ikke generere faktura PDF' },
      { status: 500 }
    )
  }
}

