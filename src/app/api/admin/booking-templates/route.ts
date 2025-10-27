import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Hent alle booking-maler (med filter for bedrift)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    if (companyId) {
      where.companyId = companyId
    }
    if (activeOnly) {
      where.isActive = true
    }

    const templates = await prisma.bookingTemplate.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            orgNumber: true,
            discountPercent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching booking templates:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Opprett ny booking-mal
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
    const {
      companyId,
      name,
      description,
      dayOfWeek,
      dayOfMonth,
      time,
      frequency,
      vehiclesConfig,
      defaultNotes,
      isActive,
      autoGenerate,
      generateDaysAhead,
    } = body

    // Validering
    if (!companyId || !name || !time || !frequency || !vehiclesConfig) {
      return NextResponse.json(
        { message: 'Mangler påkrevde felter' },
        { status: 400 }
      )
    }

    // Valider at bedriften eksisterer
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json(
        { message: 'Bedrift ikke funnet' },
        { status: 404 }
      )
    }

    // Valider frekvens-spesifikke felter
    if (frequency === 'WEEKLY' && (dayOfWeek === null || dayOfWeek === undefined)) {
      return NextResponse.json(
        { message: 'dayOfWeek er påkrevd for ukentlige maler' },
        { status: 400 }
      )
    }

    if (frequency === 'MONTHLY' && !dayOfMonth) {
      return NextResponse.json(
        { message: 'dayOfMonth er påkrevd for månedlige maler' },
        { status: 400 }
      )
    }

    // Opprett mal
    const template = await prisma.bookingTemplate.create({
      data: {
        companyId,
        name,
        description,
        dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : null,
        dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : null,
        time,
        frequency,
        vehiclesConfig,
        defaultNotes,
        isActive: isActive !== undefined ? isActive : true,
        autoGenerate: autoGenerate !== undefined ? autoGenerate : false,
        generateDaysAhead: generateDaysAhead || 30,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            orgNumber: true,
          },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating booking template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

