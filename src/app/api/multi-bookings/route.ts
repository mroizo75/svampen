import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email'
import { sendBookingConfirmationSMS } from '@/lib/sms'

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
  createAccount: boolean
  password?: string
  isExistingUser: boolean
}

interface MultiBookingData {
  vehicles: BookingVehicleData[]
  customerInfo: CustomerInfo
  scheduledDate: string
  scheduledTime: string
  customerNotes?: string
  totalPrice: number
  totalDuration: number
  isAdminBooking?: boolean
  adminOverride?: boolean
  sendSms?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const bookingData: MultiBookingData = await request.json()

    let userId = session?.user?.id
    let user: any = session?.user

    // If not logged in, handle guest/new user registration
    if (!session) {
      // Check if user wants to create account
      if (bookingData.customerInfo.createAccount) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: bookingData.customerInfo.email }
        })

        if (existingUser) {
          return NextResponse.json(
            { message: 'En bruker med denne e-posten eksisterer allerede. Vennligst logg inn.' },
            { status: 409 }
          )
        }

        // Create new user
        if (!bookingData.customerInfo.password) {
          return NextResponse.json(
            { message: 'Passord er påkrevd for å opprette konto' },
            { status: 400 }
          )
        }

        const hashedPassword = await bcrypt.hash(bookingData.customerInfo.password, 12)
        
        try {
          const newUser = await prisma.user.create({
            data: {
              email: bookingData.customerInfo.email,
              password: hashedPassword,
              firstName: bookingData.customerInfo.firstName,
              lastName: bookingData.customerInfo.lastName,
              phone: bookingData.customerInfo.phone || '',
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
      } else {
        // Guest booking - create temporary user or handle differently
        // For now, we'll create a user without password (guest)
        const existingUser = await prisma.user.findUnique({
          where: { email: bookingData.customerInfo.email }
        })

        if (existingUser) {
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
          // Create guest user (without password)
          try {
            const guestUser = await prisma.user.create({
              data: {
                email: bookingData.customerInfo.email,
                password: '', // Empty password for guest users
                firstName: bookingData.customerInfo.firstName,
                lastName: bookingData.customerInfo.lastName,
                phone: bookingData.customerInfo.phone || '',
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
    const bookingDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    
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
    const bookingTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

    if (isNaN(bookingTime.getTime())) {
      return NextResponse.json(
        { message: 'Ugyldig tid. Vennligst velg tid på nytt.' },
        { status: 400 }
      )
    }

    const estimatedEnd = new Date(bookingTime.getTime() + bookingData.totalDuration * 60000)


    // Sjekk om tiden er tilgjengelig (kun hvis IKKE admin override)
    if (!bookingData.isAdminBooking || !bookingData.adminOverride) {
      // Hent alle bookinger for samme dag (bruk samme dato-parsing som availability)
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
        },
      })
      
      
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
      console.log('🔓 Admin override aktivert - hopper over tilgjengelighetssjekk for booking')
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
        scheduledDate: bookingDate,
        scheduledTime: bookingTime,
        totalDuration: bookingData.totalDuration,
        estimatedEnd,
        totalPrice: bookingData.totalPrice,
        customerNotes: bookingData.customerNotes || null,
        status: 'PENDING',
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
        bookingId: booking.id,
        scheduledDate: bookingData.scheduledDate,
        scheduledTime: bookingData.scheduledTime,
        totalDuration: bookingData.totalDuration,
        totalPrice: bookingData.totalPrice,
        vehicles: booking.bookingVehicles.map(vehicle => ({
          vehicleType: vehicle.vehicleType.name,
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
        // Sjekk om det er et norsk mobilnummer (starter med 4 eller 9, og er 8 siffer)
        const phoneDigits = bookingData.customerInfo.phone.replace(/\s/g, '')
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
          } else {
            console.log(`✅ SMS confirmation sent to mobile number: ${bookingData.customerInfo.phone}`)
          }
        } else {
          console.log(`ℹ️ Skipping SMS - not a mobile number: ${bookingData.customerInfo.phone}`)
        }
      } else if (bookingData.isAdminBooking && !bookingData.sendSms) {
        console.log('ℹ️ SMS skipped - admin chose not to send SMS')
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