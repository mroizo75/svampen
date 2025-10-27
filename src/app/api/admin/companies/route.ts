import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Hent alle bedrifter
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const companies = await prisma.company.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search } },
            { orgNumber: { contains: search } },
            { contactEmail: { contains: search } },
          ]
        }),
        ...(activeOnly && { isActive: true }),
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
        },
        _count: {
          select: {
            bookings: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Serialize Decimal fields
    const serializedCompanies = companies.map(company => ({
      ...company,
      discountPercent: company.discountPercent ? Number(company.discountPercent) : 0,
    }))

    return NextResponse.json(serializedCompanies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { message: 'Feil ved henting av bedrifter' },
      { status: 500 }
    )
  }
}

// POST - Opprett ny bedrift
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const data = await req.json()

    // Validering
    if (!data.name || !data.contactEmail) {
      return NextResponse.json(
        { message: 'Bedriftsnavn og kontakt e-post er påkrevd' },
        { status: 400 }
      )
    }

    // Sjekk om org.nr allerede eksisterer (hvis angitt)
    if (data.orgNumber) {
      const existingCompany = await prisma.company.findUnique({
        where: { orgNumber: data.orgNumber }
      })

      if (existingCompany) {
        return NextResponse.json(
          { message: 'En bedrift med dette organisasjonsnummeret eksisterer allerede' },
          { status: 409 }
        )
      }
    }

    // Opprett bedrift
    const company = await prisma.company.create({
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
        discountPercent: data.discountPercent || 0,
        specialTerms: data.specialTerms || null,
        paymentTerms: data.paymentTerms || null,
        invoiceEmail: data.invoiceEmail || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes || null,
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

    console.log(`✅ Ny bedrift opprettet: ${company.name}`)

    // Serialize Decimal
    const serializedCompany = {
      ...company,
      discountPercent: company.discountPercent ? Number(company.discountPercent) : 0,
    }

    return NextResponse.json(
      {
        message: 'Bedrift opprettet',
        company: serializedCompany
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { message: 'Feil ved opprettelse av bedrift' },
      { status: 500 }
    )
  }
}

