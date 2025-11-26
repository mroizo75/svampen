import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
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

