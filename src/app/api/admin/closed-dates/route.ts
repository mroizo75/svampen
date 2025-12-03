import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const closedDates = await prisma.closedDate.findMany({
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json(closedDates)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching closed dates:', error.message)
    }
    return NextResponse.json(
      { error: 'Kunne ikke hente stengte dager' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.date || !body.reason) {
      return NextResponse.json(
        { error: 'Dato og grunn er påkrevd' },
        { status: 400 }
      )
    }

    // Parse dato for å sikre korrekt format
    const dateObj = new Date(body.date + 'T12:00:00')

    // Bruk upsert for å håndtere duplikater
    const closedDate = await prisma.closedDate.upsert({
      where: {
        date_type: {
          date: dateObj,
          type: body.type || 'MANUAL',
        },
      },
      update: {
        reason: body.reason,
        isRecurring: body.isRecurring || false,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
      },
      create: {
        date: dateObj,
        reason: body.reason,
        type: body.type || 'MANUAL',
        isRecurring: body.isRecurring || false,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
      },
    })

    return NextResponse.json(closedDate)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error creating closed date:', error.message, error.stack)
      return NextResponse.json(
        { error: 'Kunne ikke opprette stengt dag: ' + error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Kunne ikke opprette stengt dag' },
      { status: 500 }
    )
  }
}

