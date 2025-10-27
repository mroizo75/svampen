import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST - Generer bookinger fra mal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { daysAhead } = body // Antall dager fremover å generere bookinger for

    // Hent malen
    const template = await prisma.bookingTemplate.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            contactPerson: true,
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { message: 'Mal ikke funnet' },
        { status: 404 }
      )
    }

    if (!template.isActive) {
      return NextResponse.json(
        { message: 'Mal er ikke aktiv' },
        { status: 400 }
      )
    }

    const company = template.company

    // Finn eller opprett bruker for bedriften
    let userId: string
    if (company.contactPerson) {
      userId = company.contactPerson.id
    } else {
      // Opprett en bruker for bedriften hvis den ikke finnes
      const randomPassword = Math.random().toString(36).slice(-12)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)
      
      const newUser = await prisma.user.create({
        data: {
          email: company.contactEmail,
          password: hashedPassword,
          firstName: company.name,
          lastName: '(Bedrift)',
          phone: company.contactPhone || '',
          role: 'USER',
        },
      })
      userId = newUser.id

      // Oppdater bedriften med kontaktperson
      await prisma.company.update({
        where: { id: company.id },
        data: { contactPersonId: userId },
      })
    }

    // Parse kjøretøy-konfigurasjon
    const vehiclesConfig = template.vehiclesConfig as any[]

    // Beregn totaler basert på vehiclesConfig
    let totalDuration = 0
    let totalPrice = 0

    for (const vehicleConfig of vehiclesConfig) {
      const { vehicleTypeId, services } = vehicleConfig

      for (const serviceConfig of services) {
        const { serviceId, quantity = 1 } = serviceConfig

        // Hent service og pris
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
        })

        const servicePrice = await prisma.servicePrice.findFirst({
          where: {
            serviceId,
            vehicleTypeId,
          },
        })

        if (service && servicePrice) {
          totalDuration += service.duration * quantity
          totalPrice += Number(servicePrice.price) * quantity
        }
      }
    }

    // Anvend rabatt hvis bedriften har det
    if (company.discountPercent && Number(company.discountPercent) > 0) {
      const discount = Number(company.discountPercent) / 100
      totalPrice = totalPrice * (1 - discount)
    }

    // Hent minimum forhåndsbestillingstid fra innstillinger
    const minAdvanceBookingSetting = await prisma.adminSettings.findUnique({
      where: { key: 'min_advance_booking_hours' },
    })
    const minAdvanceHours = minAdvanceBookingSetting ? parseInt(minAdvanceBookingSetting.value) : 12

    const createdBookings = []
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Beregn tidligste tillatte booking-tidspunkt (nå + minAdvanceHours)
    const earliestBookingTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    
    // Beregn sluttdato basert på daysAhead parameter eller template setting
    const maxDaysAhead = daysAhead || template.generateDaysAhead || 30
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + maxDaysAhead)

    // Generer bookinger basert på frekvens - INNENFOR perioden
    let currentDate = new Date(today)
    
    while (currentDate <= endDate) {
      let bookingDate: Date | null = null

      if (template.frequency === 'WEEKLY') {
        // Finn neste forekomst av ukedagen
        const targetDayOfWeek = template.dayOfWeek!
        const currentDayOfWeek = currentDate.getDay()
        const daysUntilTarget = (targetDayOfWeek - currentDayOfWeek + 7) % 7
        
        bookingDate = new Date(currentDate)
        bookingDate.setDate(currentDate.getDate() + daysUntilTarget)
        
        // Hvis bookingDate er før i dag, hopp til neste uke
        if (bookingDate < today) {
          bookingDate.setDate(bookingDate.getDate() + 7)
        }
        
        // Gå til neste uke for neste iterasjon
        currentDate = new Date(bookingDate)
        currentDate.setDate(currentDate.getDate() + 7)
        
      } else if (template.frequency === 'MONTHLY') {
        // Finn neste forekomst av dagen i måneden
        const targetDayOfMonth = template.dayOfMonth!
        bookingDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDayOfMonth)
        
        // Hvis datoen er passert denne måneden, gå til neste måned
        if (bookingDate < today) {
          bookingDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, targetDayOfMonth)
        }
        
        // Gå til neste måned for neste iterasjon
        currentDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 1, targetDayOfMonth)
        
      } else {
        break // Skip ukjente frekvenser
      }
      
      // Sjekk om bookingDate er innenfor perioden
      if (!bookingDate || bookingDate > endDate) {
        break
      }

      // Kombiner bookingDate med template.time for å få full timestamp
      const [hours, minutes] = template.time.split(':').map(Number)
      const bookingDateTime = new Date(bookingDate)
      bookingDateTime.setHours(hours, minutes, 0, 0)

      // Sjekk om bookingen er innenfor minimum forhåndsbestillingstid
      if (bookingDateTime < earliestBookingTime) {
        console.log(`Booking for ${bookingDate.toISOString().split('T')[0]} ${template.time} er innenfor ${minAdvanceHours} timers vindu - hopper over`)
        continue
      }

      // Sjekk om booking allerede eksisterer for denne datoen
      const existingBooking = await prisma.booking.findFirst({
        where: {
          companyId: company.id,
          scheduledDate: bookingDate,
          scheduledTime: new Date(`1970-01-01T${template.time}:00`),
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      })

      if (existingBooking) {
        console.log(`Booking allerede eksisterer for ${bookingDate.toISOString().split('T')[0]} - hopper over`)
        continue
      }

      // Opprett booking
      const scheduledTime = new Date(`1970-01-01T${template.time}:00`)
      const estimatedEnd = new Date(scheduledTime.getTime() + totalDuration * 60000)
      
      const booking = await prisma.booking.create({
        data: {
          userId,
          companyId: company.id,
          scheduledDate: bookingDate,
          scheduledTime,
          estimatedEnd,
          totalDuration,
          totalPrice,
          status: 'CONFIRMED', // Auto-bekreft bedriftsavtaler
          customerNotes: template.defaultNotes || '',
        },
      })

      // Opprett kjøretøy og tjenester
      for (const vehicleConfig of vehiclesConfig) {
        const { vehicleTypeId, vehicleInfo, vehicleNotes, services } = vehicleConfig

        const bookingVehicle = await prisma.bookingVehicle.create({
          data: {
            bookingId: booking.id,
            vehicleTypeId,
            vehicleInfo: vehicleInfo || '',
            vehicleNotes: vehicleNotes || '',
          },
        })

        // Opprett tjenester for dette kjøretøyet
        for (const serviceConfig of services) {
          const { serviceId, quantity = 1 } = serviceConfig

          // Hent service for duration
          const service = await prisma.service.findUnique({
            where: { id: serviceId },
          })

          const servicePrice = await prisma.servicePrice.findFirst({
            where: {
              serviceId,
              vehicleTypeId,
            },
          })

          if (service && servicePrice) {
            const unitPrice = Number(servicePrice.price)
            let finalUnitPrice = unitPrice

            // Anvend rabatt
            if (company.discountPercent && Number(company.discountPercent) > 0) {
              const discount = Number(company.discountPercent) / 100
              finalUnitPrice = unitPrice * (1 - discount)
            }

            await prisma.bookingService.create({
              data: {
                bookingVehicleId: bookingVehicle.id,
                serviceId,
                quantity,
                duration: service.duration,
                unitPrice: finalUnitPrice,
                totalPrice: finalUnitPrice * quantity,
              },
            })
          }
        }
      }

      createdBookings.push({
        id: booking.id,
        date: bookingDate.toISOString().split('T')[0],
        time: template.time,
      })
    }

    // Oppdater lastGeneratedDate
    await prisma.bookingTemplate.update({
      where: { id: template.id },
      data: { lastGeneratedDate: new Date() },
    })

    return NextResponse.json({
      message: `${createdBookings.length} booking(er) opprettet`,
      bookings: createdBookings,
    })
  } catch (error) {
    console.error('Error generating bookings from template:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}

