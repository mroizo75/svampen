import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLicenseStatus } from '@/lib/license'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Kun admin kan se lisensstatus
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const status = await getLicenseStatus()

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting license status:', error)
    return NextResponse.json(
      { message: 'Kunne ikke hente lisensstatus' },
      { status: 500 }
    )
  }
}

