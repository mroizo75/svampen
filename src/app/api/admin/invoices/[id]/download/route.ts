import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { downloadInvoicePdf } from '@/lib/tripletex'

// GET - Last ned faktura som PDF
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Hent faktura
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Faktura ikke funnet' },
        { status: 404 }
      )
    }

    if (!invoice.tripletexId) {
      return NextResponse.json(
        { message: 'Faktura har ikke Tripletex ID' },
        { status: 400 }
      )
    }

    // Last ned PDF fra Tripletex
    const pdfBuffer = await downloadInvoicePdf(invoice.tripletexId)

    // Returner PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Faktura-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error downloading invoice PDF:', error)
    return NextResponse.json(
      { message: 'Feil ved nedlasting av faktura', error: String(error) },
      { status: 500 }
    )
  }
}

