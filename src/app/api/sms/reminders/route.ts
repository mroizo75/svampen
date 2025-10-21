/**
 * API endpoint for sending SMS reminders
 * This should be called by a cron job daily to send reminders for tomorrow's bookings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingReminderSMS } from '@/lib/sms'

export async function GET(req: NextRequest) {
  try {
    // Optional: Add API key authentication for cron job security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Ikke autorisert' },
        { status: 401 }
      )
    }

    // Calculate tomorrow's date range
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    console.log(`[SMS Reminders] Checking for bookings on ${tomorrow.toISOString()}`)

    // Find all confirmed bookings for tomorrow
    const tomorrowBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: 'CONFIRMED',
        // Only send to bookings that haven't been sent a reminder yet
        // You could add a reminderSent field to track this
      },
      include: {
        user: true,
        bookingVehicles: {
          include: {
            vehicleType: true,
            bookingServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    })

    console.log(`[SMS Reminders] Found ${tomorrowBookings.length} bookings for tomorrow`)

    const results = []

    for (const booking of tomorrowBookings) {
      // Skip if customer has no phone number
      if (!booking.user.phone) {
        console.log(`[SMS Reminders] Skipping booking ${booking.id} - no phone number`)
        results.push({
          bookingId: booking.id,
          success: false,
          error: 'No phone number',
        })
        continue
      }

      // Extract vehicle types
      const vehicleTypes = booking.bookingVehicles.map(bv => bv.vehicleType.name)

      // Format scheduled time
      const scheduledTime = new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', {
        hour: '2-digit',
        minute: '2-digit',
      })

      // Send SMS reminder
      const smsResult = await sendBookingReminderSMS({
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        customerPhone: booking.user.phone,
        scheduledDate: booking.scheduledDate.toISOString(),
        scheduledTime: scheduledTime,
        vehicleTypes: vehicleTypes,
      })

      results.push({
        bookingId: booking.id,
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        customerPhone: booking.user.phone,
        ...smsResult,
      })

      // Optional: Update booking to mark that reminder was sent
      // You would need to add a reminderSent or reminderSentAt field to the Booking model
      // await prisma.booking.update({
      //   where: { id: booking.id },
      //   data: { reminderSent: true },
      // })
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`[SMS Reminders] Completed: ${successCount} sent, ${failCount} failed`)

    return NextResponse.json({
      message: 'SMS reminders processed',
      summary: {
        total: results.length,
        sent: successCount,
        failed: failCount,
      },
      results,
    })
  } catch (error) {
    console.error('[SMS Reminders] Error processing reminders:', error)
    return NextResponse.json(
      { 
        message: 'En feil oppstod ved sending av SMS-påminnelser',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Allow manual triggering via POST (admin only)
  return GET(req)
}

