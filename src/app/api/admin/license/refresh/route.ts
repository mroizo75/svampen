import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { refreshLicense } from '@/lib/license'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Kun admin kan refreshe lisens
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const status = await refreshLicense()

    return NextResponse.json({
      message: 'Lisens oppdatert',
      status,
    })
  } catch (error) {
    console.error('Error refreshing license:', error)
    return NextResponse.json(
      { message: 'Kunne ikke oppdatere lisens' },
      { status: 500 }
    )
  }
}

