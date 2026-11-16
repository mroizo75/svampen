import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureCashCustomer } from '@/lib/ensure-cash-customer'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Kun administratorer har tilgang' },
        { status: 403 }
      )
    }

    const customer = await ensureCashCustomer()

    return NextResponse.json({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    })
  } catch (error) {
    console.error('Error ensuring cash customer:', error)
    return NextResponse.json(
      { message: 'Kunne ikke klargjøre kontantkunden' },
      { status: 500 }
    )
  }
}
