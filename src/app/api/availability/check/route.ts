import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/availability/check?date=2025-10-23
// Returnerer max tilgjengelig tid for en gitt dato
export async function GET(req: NextRequest) {
  try {
    // Hent åpningstider fra admin settings
    const settings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['business_hours_start', 'business_hours_end'],
        },
      },
    })
    
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)
    
    const businessHoursStart = settingsMap.business_hours_start || '08:00'
    const businessHoursEnd = settingsMap.business_hours_end || '16:00'
    
    // Parse åpningstider
    const [startHour, startMinute] = businessHoursStart.split(':').map(Number)
    const [endHour, endMinute] = businessHoursEnd.split(':').map(Number)
    
    const searchParams = req.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { message: 'Mangler dato parameter' },
        { status: 400 }
      )
    }

    // Parse dato
    const dateParts = dateParam.split('-').map(Number)
    if (dateParts.length !== 3 || dateParts.some(isNaN)) {
      return NextResponse.json(
        { message: 'Ugyldig datoformat' },
        { status: 400 }
      )
    }

    const [year, month, day] = dateParts
    const checkDate = new Date(year, month - 1, day, 0, 0, 0, 0)

    // Hent eksisterende bookinger for denne datoen
    const existingBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: checkDate,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      select: {
        id: true,
        scheduledTime: true,
        totalDuration: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    })

    // Arbeidstid fra settings
    const workStart = startHour * 60 + startMinute // Start i minutter
    const workEnd = endHour * 60 + endMinute // Slutt i minutter
    const totalWorkMinutes = workEnd - workStart // Total arbeidstid i minutter

    if (existingBookings.length === 0) {
      // Ingen bookinger - full dag tilgjengelig
      return NextResponse.json({
        date: dateParam,
        hasBookings: false,
        maxAvailableMinutes: totalWorkMinutes,
        availableSlots: [
          {
            start: businessHoursStart,
            end: businessHoursEnd,
            durationMinutes: totalWorkMinutes,
          },
        ],
        bookedSlots: [],
      })
    }

    // Konverter bookinger til tidsintervaller
    const bookedSlots = existingBookings.map(booking => {
      const scheduledTime = new Date(booking.scheduledTime)
      const startMinutes = scheduledTime.getHours() * 60 + scheduledTime.getMinutes()
      const endMinutes = startMinutes + booking.totalDuration

      return {
        start: `${String(scheduledTime.getHours()).padStart(2, '0')}:${String(scheduledTime.getMinutes()).padStart(2, '0')}`,
        end: `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
        startMinutes,
        endMinutes,
        durationMinutes: booking.totalDuration,
      }
    })

    // Finn ledige tidsrom
    const availableSlots: Array<{
      start: string
      end: string
      durationMinutes: number
    }> = []

    let currentTime = workStart

    for (const slot of bookedSlots) {
      // Sjekk om det er ledig tid før denne bookingen
      if (currentTime < slot.startMinutes) {
        const duration = slot.startMinutes - currentTime
        availableSlots.push({
          start: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
          end: slot.start,
          durationMinutes: duration,
        })
      }
      currentTime = Math.max(currentTime, slot.endMinutes)
    }

    // Sjekk om det er ledig tid etter siste booking
    if (currentTime < workEnd) {
      const duration = workEnd - currentTime
      availableSlots.push({
        start: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
        end: businessHoursEnd,
        durationMinutes: duration,
      })
    }

    // Finn største ledige tidsrom
    const maxAvailableMinutes = availableSlots.length > 0
      ? Math.max(...availableSlots.map(slot => slot.durationMinutes))
      : 0

    return NextResponse.json({
      date: dateParam,
      hasBookings: true,
      maxAvailableMinutes,
      availableSlots,
      bookedSlots,
      workingHours: {
        start: '08:00',
        end: '16:00',
        totalMinutes: totalWorkMinutes,
      },
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { message: 'Kunne ikke sjekke tilgjengelighet' },
      { status: 500 }
    )
  }
}

