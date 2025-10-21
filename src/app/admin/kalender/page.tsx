import { prisma } from '@/lib/prisma'
import CalendarView from '@/components/admin/calendar-view'

async function getBookings() {
  try {
    const bookings = await prisma.booking.findMany({
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

export default async function AdminCalendarPage() {
  const bookings = await getBookings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
        <p className="text-gray-600">Oversikt over alle bookinger</p>
      </div>

      <CalendarView bookings={bookings} />
    </div>
  )
}

