import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Hent én booking-mal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const template = await prisma.bookingTemplate.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            orgNumber: true,
            discountPercent: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { message: 'Mal ikke funnet' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching booking template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Oppdater booking-mal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
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

    // Sjekk at malen eksisterer
    const existingTemplate = await prisma.bookingTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { message: 'Mal ikke funnet' },
        { status: 404 }
      )
    }

    // Bygg update-data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (time !== undefined) updateData.time = time
    if (frequency !== undefined) updateData.frequency = frequency
    if (vehiclesConfig !== undefined) updateData.vehiclesConfig = vehiclesConfig
    if (defaultNotes !== undefined) updateData.defaultNotes = defaultNotes
    if (isActive !== undefined) updateData.isActive = isActive
    if (autoGenerate !== undefined) updateData.autoGenerate = autoGenerate
    if (generateDaysAhead !== undefined) updateData.generateDaysAhead = generateDaysAhead

    // Håndter dag-feltene basert på frekvens
    if (frequency === 'WEEKLY') {
      updateData.dayOfWeek = dayOfWeek
      updateData.dayOfMonth = null
    } else if (frequency === 'MONTHLY') {
      updateData.dayOfMonth = dayOfMonth
      updateData.dayOfWeek = null
    }

    const template = await prisma.bookingTemplate.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating booking template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Slett booking-mal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Sjekk at malen eksisterer
    const existingTemplate = await prisma.bookingTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { message: 'Mal ikke funnet' },
        { status: 404 }
      )
    }

    await prisma.bookingTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Mal slettet' })
  } catch (error) {
    console.error('Error deleting booking template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

