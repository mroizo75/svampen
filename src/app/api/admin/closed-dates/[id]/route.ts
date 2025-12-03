import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface UpdateBody {
  startTime?: string | null
  endTime?: string | null
  reason?: string
  type?: 'HOLIDAY' | 'VACATION' | 'MANUAL' | 'OTHER'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as UpdateBody

    const closedDate = await prisma.closedDate.findUnique({ where: { id } })
    if (!closedDate) {
      return NextResponse.json({ error: 'Stengt dag ikke funnet' }, { status: 404 })
    }

    const updated = await prisma.closedDate.update({
      where: { id },
      data: {
        startTime: body.startTime ?? closedDate.startTime,
        endTime: body.endTime ?? closedDate.endTime,
        reason: body.reason ?? closedDate.reason,
        type: body.type ?? closedDate.type,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating closed date:', error)
    return NextResponse.json({ error: 'Ukjent feil' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const { id } = await params

    await prisma.closedDate.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error deleting closed date:', error.message)
    }
    return NextResponse.json(
      { error: 'Kunne ikke slette stengt dag' },
      { status: 500 }
    )
  }
}

