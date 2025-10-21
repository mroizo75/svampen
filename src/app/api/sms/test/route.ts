/**
 * Test endpoint for SMS functionality
 * Only accessible in development or for admins
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendSMS, sendBookingReminderSMS } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Ikke autorisert - kun for administratorer' },
        { status: 403 }
      )
    }

    const { phoneNumber, testType = 'basic' } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Telefonnummer mangler' },
        { status: 400 }
      )
    }

    let result

    if (testType === 'reminder') {
      // Test booking reminder format
      result = await sendBookingReminderSMS({
        customerName: 'Test Kunde',
        customerPhone: phoneNumber,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '10:00',
        vehicleTypes: ['Bobil', 'Husvogn'],
      })
    } else {
      // Basic test SMS
      result = await sendSMS({
        to: phoneNumber,
        message: 'Test SMS fra Svampen booking-system. Dette er en test-melding.',
        sender: 'Svampen',
      })
    }

    if (result.success) {
      return NextResponse.json({
        message: 'Test SMS sendt!',
        ...result,
      })
    } else {
      return NextResponse.json(
        {
          message: 'Kunne ikke sende test SMS',
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[SMS Test] Error:', error)
    return NextResponse.json(
      {
        message: 'En feil oppstod ved sending av test SMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

