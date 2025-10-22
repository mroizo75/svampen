import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
  
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60')

    if (!date) {
      return NextResponse.json(
        { message: 'Dato er påkrevd' },
        { status: 400 }
      )
    }

    // Parse datoen korrekt (YYYY-MM-DD format)
    // Bruk lokal tid for å unngå tidssone problemer
    const [year, month, day] = date.split('-').map(Number)
    const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    
    // Sjekk at datoen ikke er i fortiden
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      return NextResponse.json({ availableTimes: [] })
    }

    // Hent eksisterende bestillinger for datoen (alle aktive bookinger)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        scheduledTime: true,
        estimatedEnd: true,
        totalDuration: true,
      },
    })
    
    // Debug logging
    console.log('')
    console.log('='.repeat(80))
    console.log(`[Availability] Checking date: ${date}`)
    console.log(`[Availability] Requested duration: ${duration} minutes`)
    console.log(`[Availability] Found ${existingBookings.length} existing booking(s):`)
    existingBookings.forEach(booking => {
      const start = new Date(booking.scheduledTime)
      const end = new Date(booking.estimatedEnd)
      console.log(`  - ${booking.id.substring(0, 8)}: ${start.toISOString()} to ${end.toISOString()}`)
      console.log(`    (Local: ${start.toLocaleString('nb-NO')} - ${end.toLocaleString('nb-NO')})`)
    })

    // Hent tilgjengelige tidsslots for datoen
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        date: selectedDate,
        isAvailable: true,
        isHoliday: false,
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Generer liste over ledige tider
    const availableTimes: string[] = []
    
    // Parse åpningstider fra settings
    const [startHour, startMinute] = businessHoursStart.split(':').map(Number)
    const [endHour, endMinute] = businessHoursEnd.split(':').map(Number)
    
    const defaultStartHour = startHour
    let defaultEndHour = endHour
    
    // For spesielt lange tjenester (over 6 timer), utvid arbeidstiden med 2 timer
    const durationHours = duration / 60
    if (durationHours > 6) {
      defaultEndHour = Math.min(endHour + 2, 20) // Utvid maks til kl. 20:00
      console.log(`[Availability] Long service detected (${durationHours.toFixed(1)}h), extending working hours to ${defaultEndHour}:00`)
    }
    
    // Hvis tjenesten fortsatt er for lang, gi beskjed
    const maxServiceDuration = (defaultEndHour - defaultStartHour) * 60
    if (duration > maxServiceDuration) {
      console.log(`[Availability] Service duration (${duration}min) exceeds max day capacity (${maxServiceDuration}min)`)
      return NextResponse.json({ 
        availableTimes: [],
        message: `Denne kombinasjonen av tjenester (${Math.floor(duration/60)}t ${duration%60}min) er for lang for én dag. Vennligst book tjenestene på separate dager, eller kontakt oss for å lage en spesialtilpasset booking.`,
        duration,
        maxDuration: maxServiceDuration
      })
    }
    
    // Hjelpefunksjon for å sjekke om et tidsrom overlapper med eksisterende bookinger
    const isTimeSlotAvailable = (proposedStart: Date, proposedEnd: Date): boolean => {
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.scheduledTime)
        const bookingEnd = new Date(booking.estimatedEnd)
        
        // Sjekk om det er overlapp:
        // Det er overlapp hvis:
        // 1. Ny booking starter før eksisterende slutter OG
        // 2. Ny booking slutter etter eksisterende starter
        // 
        // Med andre ord: IKKE overlapp bare hvis:
        // - Ny booking slutter FØR eksisterende starter (proposedEnd <= bookingStart)
        // - Ny booking starter ETTER eksisterende slutter (proposedStart >= bookingEnd)
        const overlaps = proposedStart < bookingEnd && proposedEnd > bookingStart
        
        if (overlaps) {
          const proposedStartLocal = proposedStart.toLocaleString('nb-NO', { hour: '2-digit', minute: '2-digit' })
          const proposedEndLocal = proposedEnd.toLocaleString('nb-NO', { hour: '2-digit', minute: '2-digit' })
          const bookingStartLocal = bookingStart.toLocaleString('nb-NO', { hour: '2-digit', minute: '2-digit' })
          const bookingEndLocal = bookingEnd.toLocaleString('nb-NO', { hour: '2-digit', minute: '2-digit' })
          
          console.log(`  [BLOCKED] ${proposedStartLocal}-${proposedEndLocal} overlaps with booking ${booking.id.substring(0, 8)} (${bookingStartLocal}-${bookingEndLocal})`)
        }
        
        return overlaps
      })
      
      return !hasConflict
    }
    
    if (timeSlots.length === 0) {
      // Bruk standard åpningstider (generer tider hvert 30. minutt)
      // Viktig: Kun vis starttider som er INNENFOR arbeidstid (08:00-16:00)
      for (let hour = defaultStartHour; hour < 16; hour++) { // Hard-cap på kl. 16:00 start
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          // Opprett datetime for denne timen (bruk lokal tid for å unngå tidssone problemer)
          const proposedStart = new Date(year, month - 1, day, hour, minute, 0, 0)
          
          // Beregn sluttid basert på varighet
          const proposedEnd = new Date(proposedStart.getTime() + duration * 60000)
          
          // Sjekk at sluttiden er innenfor utvidet arbeidstid (kan gå til 18:00 for lange tjenester)
          const endHour = proposedEnd.getHours()
          const endMinute = proposedEnd.getMinutes()
          if (endHour > defaultEndHour || (endHour === defaultEndHour && endMinute > 0)) {
            console.log(`  [Skip] ${timeString} - would end at ${endHour}:${endMinute.toString().padStart(2, '0')} (after closing time ${defaultEndHour}:00)`)
            continue
          }
          
          // Sjekk om tiden er tilgjengelig
          const available = isTimeSlotAvailable(proposedStart, proposedEnd)
          if (available) {
            availableTimes.push(timeString)
            console.log(`  [Available] ${timeString} (ends at ${endHour}:${endMinute.toString().padStart(2, '0')})`)
          }
        }
      }
    } else {
      // Bruk definerte tidsslots
      timeSlots.forEach(slot => {
        const startTime = new Date(slot.startTime)
        const timeString = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
        
        // Beregn sluttid basert på varighet
        const endTime = new Date(startTime.getTime() + duration * 60000)
        
        // Sjekk om tiden er tilgjengelig
        if (isTimeSlotAvailable(startTime, endTime)) {
          availableTimes.push(timeString)
        }
      })
    }

    console.log(`[Availability] Returning ${availableTimes.length} available time(s)`)
    console.log('='.repeat(80))
    console.log('')
    
    return NextResponse.json({ availableTimes })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av ledige tider' },
      { status: 500 }
    )
  }
}