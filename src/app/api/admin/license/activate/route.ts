import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { activateLicense } from '@/lib/license'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Kun admin kan aktivere lisens
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { licenseKey, validationToken } = body

    console.log('🔑 Aktivering forsøk:', { 
      licenseKey: licenseKey?.substring(0, 20) + '...', 
      hasToken: !!validationToken 
    })

    if (!licenseKey || !validationToken) {
      return NextResponse.json(
        { error: 'Lisenskode og validerings-token er påkrevd' },
        { status: 400 }
      )
    }

    const result = await activateLicense(licenseKey, validationToken)
    console.log('📊 Aktivering resultat:', { success: result.success, message: result.message })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      license: result.license,
    })
  } catch (error) {
    console.error('Error activating license:', error)
    return NextResponse.json(
      { message: 'Kunne ikke aktivere lisens' },
      { status: 500 }
    )
  }
}

