import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Hent enkelt bedrift
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contactPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        bookings: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            status: true,
            totalPrice: true,
          },
          orderBy: {
            scheduledDate: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
          }
        }
      },
    })

    if (!company) {
      return NextResponse.json(
        { message: 'Bedrift ikke funnet' },
        { status: 404 }
      )
    }

    // Serialize Decimal
    const serializedCompany = {
      ...company,
      discountPercent: company.discountPercent ? Number(company.discountPercent) : 0,
      bookings: company.bookings.map(b => ({
        ...b,
        totalPrice: Number(b.totalPrice),
      })),
    }

    return NextResponse.json(serializedCompany)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { message: 'Feil ved henting av bedrift' },
      { status: 500 }
    )
  }
}

// PUT - Oppdater bedrift
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const data = await req.json()

    // Sjekk om bedriften eksisterer
    const existingCompany = await prisma.company.findUnique({
      where: { id: params.id }
    })

    if (!existingCompany) {
      return NextResponse.json(
        { message: 'Bedrift ikke funnet' },
        { status: 404 }
      )
    }

    // Sjekk org.nr duplikat (hvis endret)
    if (data.orgNumber && data.orgNumber !== existingCompany.orgNumber) {
      const duplicateOrgNumber = await prisma.company.findFirst({
        where: {
          orgNumber: data.orgNumber,
          NOT: { id: params.id }
        }
      })

      if (duplicateOrgNumber) {
        return NextResponse.json(
          { message: 'En annen bedrift med dette organisasjonsnummeret eksisterer allerede' },
          { status: 409 }
        )
      }
    }

    // Oppdater bedrift
    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: {
        name: data.name,
        orgNumber: data.orgNumber || null,
        contactPersonId: data.contactPersonId || null,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        address: data.address || null,
        postalCode: data.postalCode || null,
        city: data.city || null,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        discountPercent: data.discountPercent !== undefined ? data.discountPercent : 0,
        specialTerms: data.specialTerms || null,
        paymentTerms: data.paymentTerms || null,
        invoiceEmail: data.invoiceEmail || null,
        isActive: data.isActive !== undefined ? data.isActive : existingCompany.isActive,
        notes: data.notes !== undefined ? data.notes : existingCompany.notes,
      },
      include: {
        contactPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    console.log(`✅ Bedrift oppdatert: ${updatedCompany.name}`)

    // Serialize Decimal
    const serializedCompany = {
      ...updatedCompany,
      discountPercent: updatedCompany.discountPercent ? Number(updatedCompany.discountPercent) : 0,
    }

    return NextResponse.json({
      message: 'Bedrift oppdatert',
      company: serializedCompany
    })

  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { message: 'Feil ved oppdatering av bedrift' },
      { status: 500 }
    )
  }
}

// DELETE - Slett bedrift
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    // Sjekk om bedriften har bookinger
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { message: 'Bedrift ikke funnet' },
        { status: 404 }
      )
    }

    if (company._count.bookings > 0) {
      // Soft delete - deaktiver istedenfor å slette
      await prisma.company.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      return NextResponse.json({
        message: `Bedriften er deaktivert (har ${company._count.bookings} bookinger)`
      })
    }

    // Hard delete hvis ingen bookinger
    await prisma.company.delete({
      where: { id: params.id }
    })

    console.log(`✅ Bedrift slettet: ${company.name}`)

    return NextResponse.json({
      message: 'Bedrift slettet'
    })

  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { message: 'Feil ved sletting av bedrift' },
      { status: 500 }
    )
  }
}

