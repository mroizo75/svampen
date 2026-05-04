import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingReminderSMS } from '@/lib/sms'
import { sendBookingReminderEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Hent kun CONFIRMED bookinger for i morgen som ikke allerede har fått påminnelse
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: 'CONFIRMED',
        reminderSentAt: null,
      },
      include: {
        user: true,
        bookingVehicles: {
          include: {
            vehicleType: true,
          },
        },
      },
    })

    let smsSent = 0
    let emailSent = 0
    let failed = 0

    for (const booking of bookings) {
      const customerName = `${booking.user.firstName} ${booking.user.lastName}`
      const scheduledTime = new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const vehicleTypes = booking.bookingVehicles.map(bv => bv.vehicleType.name)
      const scheduledDate = booking.scheduledDate.toISOString()

      let anySuccess = false

      // Send SMS hvis telefonnummer finnes
      if (booking.user.phone) {
        const smsResult = await sendBookingReminderSMS({
          customerName,
          customerPhone: booking.user.phone,
          scheduledDate,
          scheduledTime,
          vehicleTypes,
        })

        if (smsResult.success) {
          smsSent++
          anySuccess = true
        } else {
          console.error(`[Booking Reminders] SMS feilet for booking ${booking.id}:`, smsResult.error)
        }
      }

      // Send e-post hvis e-postadressen ikke er en intern placeholder
      const isRealEmail = booking.user.email && !booking.user.email.endsWith('@svampen.local')
      if (isRealEmail) {
        const emailResult = await sendBookingReminderEmail({
          customerName,
          customerEmail: booking.user.email,
          scheduledDate,
          scheduledTime,
          bookingId: booking.id,
          vehicleTypes,
        })

        if (emailResult.success) {
          emailSent++
          anySuccess = true
        } else {
          console.error(`[Booking Reminders] E-post feilet for booking ${booking.id}:`, emailResult.error)
        }
      }

      if (anySuccess) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSentAt: new Date() },
        })
      } else {
        failed++
      }
    }

    console.log(`[Booking Reminders] Ferdig: ${smsSent} SMS, ${emailSent} e-poster, ${failed} feilet`)

    return NextResponse.json({
      success: true,
      summary: {
        total: bookings.length,
        smsSent,
        emailSent,
        failed,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Booking Reminders] Kritisk feil:', error)
    return NextResponse.json(
      { error: 'Feil ved sending av påminnelser' },
      { status: 500 }
    )
  }
}
