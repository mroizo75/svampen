import { prisma } from '@/lib/prisma'
import CalendarView from '@/components/admin/calendar-view'

async function getBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          not: 'CANCELLED', // Ikke vis avbestilte bookinger
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
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
      orderBy: {
        scheduledDate: 'desc',
      },
    })

    // Konverter Decimal til Number for client component
    const serializedBookings = bookings.map(booking => ({
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
    }))

    return serializedBookings
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return []
  }
}

async function getBusinessHours() {
  try {
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
    
    return {
      start: settingsMap.business_hours_start || '08:00',
      end: settingsMap.business_hours_end || '16:00',
    }
  } catch (error) {
    console.error('Error fetching business hours:', error)
    return {
      start: '08:00',
      end: '16:00',
    }
  }
}

export default async function AdminCalendarPage() {
  const [bookings, businessHours] = await Promise.all([
    getBookings(),
    getBusinessHours(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
        <p className="text-gray-600">Oversikt over alle bookinger</p>
      </div>

      <CalendarView 
        bookings={bookings} 
        businessHoursStart={businessHours.start}
        businessHoursEnd={businessHours.end}
      />

      {/* Live update notice */}
      <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
        🔴 LIVE • Oppdateres automatisk
      </div>
    </div>
  )
}

