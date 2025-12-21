import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email'
import { sendBookingConfirmationSMS } from '@/lib/sms'
import { notifyBookingUpdate } from '@/lib/sse-notifications'
import { isNorwegianHoliday, isWeekend } from '@/lib/norwegian-holidays'
import { rateLimiter, getClientIp } from '@/lib/rate-limiter'

interface BookingVehicleData {
  vehicleTypeId: string
  vehicleInfo?: string
  vehicleNotes?: string
  services: Array<{
    serviceId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    duration: number
  }>
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  postalCode?: string
  city?: string
  createAccount: boolean
  password?: string
  isExistingUser: boolean
}

interface MultiBookingData {
  vehicles: BookingVehicleData[]
  customerInfo: CustomerInfo
  companyId?: string  // Bedriftsbooking
  scheduledDate: string
  scheduledTime: string
  customerNotes?: string
  totalPrice: number
  totalDuration: number
  isAdminBooking?: boolean
  adminOverride?: boolean
  sendSms?: boolean
}

function validateNorwegianPostalCode(postalCode: string): boolean {
  // Norske postnummer er 4 siffer
  const cleanedCode = postalCode.replace(/\s/g, '')
  return /^\d{4}$/.test(cleanedCode) && parseInt(cleanedCode) >= 0 && parseInt(cleanedCode) <= 9999
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const bookingData: MultiBookingData = await request.json()

    // Rate limiting - BARE for ikke-innloggede brukere og ikke-admin bookinger
    // Dette beskytter mot automatiske script-angrep
    if (!session || session.user.role === 'USER') {
      const ip = getClientIp(request)
      const rateLimitKey = `booking:${ip}`
      
      // Streng rate limiting for bookinger:
      // Maks 3 bookinger per IP per 10 minutter
      // Blokkert i 30 minutter hvis overskredet
      const isAllowed = rateLimiter.checkCustomLimit(
        rateLimitKey,
        3,
        10 * 60 * 1000,
        30 * 60 * 1000
      )
      
      if (!isAllowed) {
        console.warn(`🚨 Booking rate limit exceeded for IP: ${ip}`)
        return NextResponse.json(
          { message: 'For mange bestillingsforsøk. Vennligst vent 30 minutter før du prøver igjen.' },
          { status: 429 }
        )
      }
    }

    let userId = session?.user?.id
    let user: any = session?.user

    // If admin is booking for a customer, handle customer info
    // OR if not logged in, handle guest/new user registration
    if (bookingData.isAdminBooking || !session) {
      // Check if user wants to create account
      if (bookingData.customerInfo.createAccount) {
        // KRITISK: Hvis e-post er placeholder for admin-booking, generer UNIK e-post
        let emailToUse = bookingData.customerInfo.email
        const isPlaceholderEmail = !emailToUse || emailToUse.trim() === '' || emailToUse === '*' || emailToUse.includes('*')
        
        if (isPlaceholderEmail && bookingData.isAdminBooking) {
          // Generer GARANTERT unik placeholder e-post for admin-booking
          // Bruk UUID + timestamp for å sikre at hver kunde får sin egen bruker
          const uniqueId = crypto.randomUUID().split('-')[0] // Første del av UUID
          const timestamp = Date.now()
          const nameSlug = `${bookingData.customerInfo.firstName}-${bookingData.customerInfo.lastName}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 30) // Begrens lengde
          emailToUse = `noepost.${nameSlug}.${uniqueId}.${timestamp}@svampen.local`
        } else if (isPlaceholderEmail && !bookingData.isAdminBooking) {
          // Kunde-booking må ha gyldig e-post
          return NextResponse.json(
            { message: 'En gyldig e-postadresse er påkrevd' },
            { status: 400 }
          )
        }
        
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: emailToUse }
        })

        if (existingUser) {
          // KRITISK: ALDRI oppdater eksisterende brukers informasjon!
          // Dette ville overskrive kundedata og føre til at bookinger viser feil kunde.
          // Hvis admin prøver å booke med en e-post som allerede finnes,
          // men med annet navn - da MÅ de bruke en annen e-post.
          
          const isDifferentCustomer = 
            existingUser.firstName !== bookingData.customerInfo.firstName ||
            existingUser.lastName !== bookingData.customerInfo.lastName
          
          if (isDifferentCustomer && bookingData.isAdminBooking) {
            // Admin prøver å booke for en ANNEN kunde med SAMME e-post
            return NextResponse.json(
              { 
                message: `E-posten ${emailToUse} tilhører allerede kunden "${existingUser.firstName} ${existingUser.lastName}". Hvis dette er en ny kunde, vennligst bruk en annen e-postadresse.`,
                existingCustomer: `${existingUser.firstName} ${existingUser.lastName}`
              },
              { status: 409 }
            )
          }
          
          // Bruk eksisterende bruker AS-IS (samme kunde)
          userId = existingUser.id
          user = {
            id: existingUser.id,
            email: existingUser.email,
            name: `${existingUser.firstName} ${existingUser.lastName}`,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            phone: existingUser.phone,
            role: existingUser.role,
          }
        } else {
          // Create new user
          // For admin bookings, password is not required (will be set to random)
          let hashedPassword: string
          
          if (bookingData.isAdminBooking) {
            // Generate random password for admin-created accounts
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
            hashedPassword = await bcrypt.hash(randomPassword, 12)
          } else {
            // For self-registration, password is required
            if (!bookingData.customerInfo.password) {
              return NextResponse.json(
                { message: 'Passord er påkrevd for å opprette konto' },
                { status: 400 }
              )
            }
            hashedPassword = await bcrypt.hash(bookingData.customerInfo.password, 12)
          }
        
        try {
          const newUser = await prisma.user.create({
            data: {
              email: emailToUse,  // Bruker den unike e-posten (kan være generert)
              password: hashedPassword,
              firstName: bookingData.customerInfo.firstName,
              lastName: bookingData.customerInfo.lastName,
              phone: bookingData.customerInfo.phone || '',
              address: bookingData.customerInfo.address || null,
              postalCode: bookingData.customerInfo.postalCode || null,
              city: bookingData.customerInfo.city || null,
              role: 'USER',
            }
          })
          
          userId = newUser.id
          user = {
            id: newUser.id,
            email: newUser.email,
            name: `${newUser.firstName} ${newUser.lastName}`,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
            role: newUser.role,
          }
          } catch (error) {
            console.error('Error creating user:', error)
            return NextResponse.json(
              { message: 'Feil ved opprettelse av bruker' },
              { status: 500 }
            )
          }
        }
      } else {
        // Guest booking (no account creation) - create temporary user or handle differently
        // KRITISK: Hvis e-post er placeholder (* eller lignende), generer UNIK e-post
        let emailToUse = bookingData.customerInfo.email
        const isPlaceholderEmail = !emailToUse || emailToUse.trim() === '' || emailToUse === '*' || emailToUse.includes('*')
        
        if (isPlaceholderEmail) {
          // Generer GARANTERT unik placeholder e-post basert på UUID + timestamp
          const uniqueId = crypto.randomUUID().split('-')[0] // Første del av UUID
          const timestamp = Date.now()
          const nameSlug = `${bookingData.customerInfo.firstName}-${bookingData.customerInfo.lastName}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 30) // Begrens lengde
          emailToUse = `noepost.${nameSlug}.${uniqueId}.${timestamp}@svampen.local`
        }
        
        const existingUser = await prisma.user.findUnique({
          where: { email: emailToUse }
        })

        if (existingUser) {
          // KRITISK: ALDRI oppdater eksisterende brukers informasjon!
          const isDifferentCustomer = 
            existingUser.firstName !== bookingData.customerInfo.firstName ||
            existingUser.lastName !== bookingData.customerInfo.lastName
          
          if (isDifferentCustomer && bookingData.isAdminBooking) {
            // Admin prøver å booke for en ANNEN kunde med SAMME e-post
            return NextResponse.json(
              { 
                message: `E-posten ${emailToUse} tilhører allerede kunden "${existingUser.firstName} ${existingUser.lastName}". Hvis dette er en ny kunde, vennligst bruk en annen e-postadresse.`,
                existingCustomer: `${existingUser.firstName} ${existingUser.lastName}`
              },
              { status: 409 }
            )
          }
          
          // Bruk eksisterende bruker AS-IS
          userId = existingUser.id
          user = {
            id: existingUser.id,
            email: existingUser.email,
            name: `${existingUser.firstName} ${existingUser.lastName}`,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            phone: existingUser.phone,
            role: existingUser.role,
          }
        } else {
          // Create guest user (with random password for security)
          try {
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
            const hashedPassword = await bcrypt.hash(randomPassword, 12)
            
            const guestUser = await prisma.user.create({
              data: {
                email: emailToUse,  // Bruker den unike e-posten (kan være generert)
                password: hashedPassword,
                firstName: bookingData.customerInfo.firstName,
                lastName: bookingData.customerInfo.lastName,
                phone: bookingData.customerInfo.phone || '',
                address: bookingData.customerInfo.address || null,
                postalCode: bookingData.customerInfo.postalCode || null,
                city: bookingData.customerInfo.city || null,
                role: 'USER',
              }
            })
            userId = guestUser.id
            user = {
              id: guestUser.id,
              email: guestUser.email,
              name: `${guestUser.firstName} ${guestUser.lastName}`,
              firstName: guestUser.firstName,
              lastName: guestUser.lastName,
              phone: guestUser.phone,
              role: guestUser.role,
            }
          } catch (error) {
            console.error('Error creating guest user:', error)
            return NextResponse.json(
              { message: 'Feil ved opprettelse av gjeste bruker' },
              { status: 500 }
            )
          }
        }
      }
    }

    // Log final user info before creating booking
    if (bookingData.isAdminBooking) {
      console.log('✅ Admin-booking - bruker funnet/opprettet:', {
        userId: userId,
        userName: user?.name || `${user?.firstName} ${user?.lastName}`,
        userEmail: user?.email,
        adminEmail: session?.user?.email
      })
    }

    // Validering
    if (!bookingData.vehicles || bookingData.vehicles.length === 0) {
      return NextResponse.json(
        { message: 'Du må legge til minst ett kjøretøy' },
        { status: 400 }
      )
    }

    if (!bookingData.scheduledDate || !bookingData.scheduledTime) {
      return NextResponse.json(
        { message: 'Dato og tid må velges' },
        { status: 400 }
      )
    }

    if (!bookingData.customerInfo || !bookingData.customerInfo.email || !bookingData.customerInfo.firstName || !bookingData.customerInfo.lastName) {
      return NextResponse.json(
        { message: 'Kunde informasjon må være fullstendig utfylt' },
        { status: 400 }
      )
    }

    // Valider postnummer hvis oppgitt (og ikke admin booking med override)
    if (bookingData.customerInfo.postalCode && (!bookingData.isAdminBooking || !bookingData.adminOverride)) {
      if (!validateNorwegianPostalCode(bookingData.customerInfo.postalCode)) {
        return NextResponse.json(
          { message: 'Ugyldig postnummer. Norske postnummer består av 4 siffer (0000-9999).' },
          { status: 400 }
        )
      }
    }

    // Valider at alle kjøretøy har tjenester
    for (const vehicle of bookingData.vehicles) {
      if (!vehicle.services || vehicle.services.length === 0) {
        return NextResponse.json(
          { message: 'Alle kjøretøy må ha minst en tjeneste' },
          { status: 400 }
        )
      }
    }

    // Opprett datetime objekter (bruk lokal tid for å unngå tidssone problemer)
    
    const dateParts = bookingData.scheduledDate.split('-').map(Number)
    if (dateParts.length !== 3 || dateParts.some(isNaN)) {
      return NextResponse.json(
        { message: 'Ugyldig datoformat. Vennligst velg dato på nytt.' },
        { status: 400 }
      )
    }
    
    const [year, month, day] = dateParts
    // Lagre datoen som UTC
    const bookingDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { message: 'Ugyldig dato. Vennligst velg dato på nytt.' },
        { status: 400 }
      )
    }
    
    const timeParts = bookingData.scheduledTime.split(':').map(Number)
    if (timeParts.length < 2 || timeParts.some(isNaN)) {
      return NextResponse.json(
        { message: 'Ugyldig tidsformat. Vennligst velg tid på nytt.' },
        { status: 400 }
      )
    }
    
    const [hours, minutes] = timeParts
    // Lagre tiden som UTC, men behandle input-verdien som lokal tid
    // Dette sikrer at 07:00 Oslo lagres som 07:00 i databasen (ikke 06:00)
    const bookingTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))

    if (isNaN(bookingTime.getTime())) {
      return NextResponse.json(
        { message: 'Ugyldig tid. Vennligst velg tid på nytt.' },
        { status: 400 }
      )
    }

    const estimatedEnd = new Date(bookingTime.getTime() + bookingData.totalDuration * 60000)

    // Sjekk om dagen er stengt (kun hvis IKKE admin override)
    if (!bookingData.isAdminBooking || !bookingData.adminOverride) {
      // Sjekk helg
      if (isWeekend(bookingDate)) {
        return NextResponse.json(
          { message: 'Vi holder stengt i helgene' },
          { status: 400 }
        )
      }

      // Sjekk norsk helligdag
      const holidayCheck = isNorwegianHoliday(bookingDate)
      if (holidayCheck.isHoliday) {
        return NextResponse.json(
          { message: `Vi holder stengt på ${holidayCheck.name}` },
          { status: 400 }
        )
      }

      // Sjekk manuelt stengte dager (fra database)
      // Normaliser dato for sammenligning
      const startOfBookingDate = new Date(bookingDate)
      startOfBookingDate.setHours(0, 0, 0, 0)
      const endOfBookingDate = new Date(bookingDate)
      endOfBookingDate.setHours(23, 59, 59, 999)
      
      const closedDate = await prisma.closedDate.findFirst({
        where: {
          date: {
            gte: startOfBookingDate,
            lte: endOfBookingDate,
          },
        },
      })
      
      if (closedDate) {
        return NextResponse.json(
          { message: `Vi holder stengt denne dagen: ${closedDate.reason}` },
          { status: 400 }
        )
      }
    }

    // Sjekk om tiden er tilgjengelig (kun hvis IKKE admin override)
    if (!bookingData.isAdminBooking || !bookingData.adminOverride) {
      // Hent alle bookinger for samme dag (UTC for konsistens)
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
      
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
          userId: true,
          user: {
            select: {
              email: true,
              phone: true,
            }
          }
        },
      })
      
      // KRITISK: Sjekk for duplikat booking (samme bruker, samme tid)
      // Dette forhindrer at én person booker flere ganger på samme tidspunkt
      if (userId) {
        const duplicateBooking = existingBookings.find(booking => {
          return booking.userId === userId && 
                 booking.scheduledTime.getTime() === bookingTime.getTime()
        })
        
        if (duplicateBooking) {
          return NextResponse.json(
            { message: 'Du har allerede en bestilling på dette tidspunktet. Vennligst velg en annen tid eller avbestill den eksisterende bestillingen først.' },
            { status: 409 }
          )
        }
      }
      
      // EKSTRA BESKYTTELSE: Sjekk for samme e-post/telefon på samme tid
      // Dette fanger opp tilfeller hvor noen prøver å lage flere brukere
      if (bookingData.customerInfo.email || bookingData.customerInfo.phone) {
        const suspiciousBooking = existingBookings.find(booking => {
          const sameTime = booking.scheduledTime.getTime() === bookingTime.getTime()
          const sameEmail = booking.user.email === bookingData.customerInfo.email
          const samePhone = booking.user.phone && 
                           bookingData.customerInfo.phone && 
                           booking.user.phone.replace(/[\s\-()]/g, '') === bookingData.customerInfo.phone.replace(/[\s\-()]/g, '')
          
          return sameTime && (sameEmail || samePhone)
        })
        
        if (suspiciousBooking) {
          return NextResponse.json(
            { message: 'Det finnes allerede en bestilling registrert med dine kontaktopplysninger på dette tidspunktet.' },
            { status: 409 }
          )
        }
      }
      
      
      // Sjekk for overlapp
      const conflictingBooking = existingBookings.find(booking => {
        const bookingStart = new Date(booking.scheduledTime)
        const bookingEnd = new Date(booking.estimatedEnd)
        
        // Overlapp hvis: (bookingTime < bookingEnd) OG (estimatedEnd > bookingStart)
        const overlaps = bookingTime < bookingEnd && estimatedEnd > bookingStart
        
        if (overlaps) {
        }
        
        return overlaps
      })

      if (conflictingBooking) {
        return NextResponse.json(
          { message: 'Den valgte tiden er ikke lenger tilgjengelig. Vennligst oppdater siden og velg en annen tid.' },
          { status: 409 }
        )
      }
    } else {
      // Admin override active - skipping availability check
    }
    

    // Sjekk at userId er definert før booking opprettes
    if (!userId) {
      return NextResponse.json(
        { message: 'Bruker ID ikke funnet' },
        { status: 500 }
      )
    }

    // Opprett booking med nested data
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        companyId: bookingData.companyId || null,  // Bedrifts-ID hvis bedriftsbooking
        scheduledDate: bookingDate,
        scheduledTime: bookingTime,
        totalDuration: bookingData.totalDuration,
        estimatedEnd,
        totalPrice: bookingData.totalPrice,
        customerNotes: bookingData.customerNotes || null,
        status: 'CONFIRMED',
        bookingVehicles: {
          create: bookingData.vehicles.map(vehicle => ({
            vehicleTypeId: vehicle.vehicleTypeId,
            vehicleInfo: vehicle.vehicleInfo || null,
            vehicleNotes: vehicle.vehicleNotes || null,
            bookingServices: {
              create: vehicle.services.map(service => ({
                serviceId: service.serviceId,
                quantity: service.quantity,
                unitPrice: service.unitPrice,
                totalPrice: service.totalPrice,
                duration: service.duration,
              }))
            }
          }))
        }
      },
      include: {
        bookingVehicles: {
          include: {
            vehicleType: true,
            bookingServices: {
              include: {
                service: true,
              }
            }
          }
        },
        user: true,
      },
    })

    // Send e-post bekreftelse til kunde
    try {
      const emailData = {
        customerName: `${bookingData.customerInfo.firstName} ${bookingData.customerInfo.lastName}`,
        customerEmail: bookingData.customerInfo.email,
        customerPhone: bookingData.customerInfo.phone,
        customerAddress: bookingData.customerInfo.address,
        customerPostalCode: bookingData.customerInfo.postalCode,
        customerCity: bookingData.customerInfo.city,
        bookingId: booking.id,
        scheduledDate: bookingData.scheduledDate,
        scheduledTime: bookingData.scheduledTime,
        totalDuration: bookingData.totalDuration,
        totalPrice: bookingData.totalPrice,
        customerNotes: bookingData.customerNotes || undefined,
        vehicles: booking.bookingVehicles.map(vehicle => ({
          vehicleType: vehicle.vehicleType.name,
          vehicleInfo: vehicle.vehicleInfo || undefined,
          vehicleNotes: vehicle.vehicleNotes || undefined,
          services: vehicle.bookingServices.map(bs => ({
            name: bs.service.name,
            price: Number(bs.totalPrice),
          }))
        }))
      }

      // Send bekreftelse til kunde
      const customerEmailResult = await sendBookingConfirmationEmail(emailData)
      if (!customerEmailResult.success) {
        console.error('Failed to send customer confirmation email:', customerEmailResult.error)
      }

      // Send notifikasjon til admin
      const adminEmailResult = await sendAdminNotificationEmail(emailData)
      if (!adminEmailResult.success) {
        console.error('Failed to send admin notification email:', adminEmailResult.error)
      }

      // Send SMS bekreftelse til kunde (hvis telefonnummer er oppgitt og det er et mobilnummer)
      // For admin-bookinger: respekter sendSms flagget
      // For kunde-bookinger: send alltid (default)
      const shouldSendSms = bookingData.isAdminBooking 
        ? bookingData.sendSms === true 
        : true // Default true for kunde-bookinger
      
      if (shouldSendSms && bookingData.customerInfo.phone) {
        // Fjern alle mellomrom og spesialtegn, behold kun siffer og eventuelt +
        let phoneDigits = bookingData.customerInfo.phone.replace(/[\s\-()]/g, '')
        
        // Fjern +47 eller 47 prefix hvis det finnes
        if (phoneDigits.startsWith('+47')) {
          phoneDigits = phoneDigits.substring(3)
        } else if (phoneDigits.startsWith('47') && phoneDigits.length === 10) {
          phoneDigits = phoneDigits.substring(2)
        }
        
        // Sjekk om det er et norsk mobilnummer (starter med 4 eller 9, og er 8 siffer)
        const isMobileNumber = /^[49]\d{7}$/.test(phoneDigits)
        
        if (isMobileNumber) {
          const smsResult = await sendBookingConfirmationSMS({
            customerName: emailData.customerName,
            customerPhone: bookingData.customerInfo.phone,
            scheduledDate: bookingData.scheduledDate,
            scheduledTime: bookingData.scheduledTime,
            bookingId: booking.id,
          })
          if (!smsResult.success) {
            console.error('Failed to send confirmation SMS:', smsResult.error)
          }
        }
      }
    } catch (emailError) {
      // Vi logger feilen, men lar ikke e-post feil stoppe booking prosessen
      console.error('Error sending emails/SMS:', emailError)
    }

    // Serialize Decimal to Number for client components
    const serializedBooking = {
      ...booking,
      totalPrice: Number(booking.totalPrice),
      bookingVehicles: booking.bookingVehicles.map(vehicle => ({
        ...vehicle,
        bookingServices: vehicle.bookingServices.map(service => ({
          ...service,
          unitPrice: Number(service.unitPrice),
          totalPrice: Number(service.totalPrice),
        })),
      })),
    }

    // Notify SSE clients about new booking
    notifyBookingUpdate()

    return NextResponse.json(serializedBooking, { status: 201 })
  } catch (error) {
    console.error('Error creating multi-booking:', error)
    
    // Gi mer detaljert feilmelding basert på error type
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { message: 'Database feil: Bruker ID er ugyldig' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'En feil oppstod ved opprettelse av bestilling' },
      { status: 500 }
    )
  }
}