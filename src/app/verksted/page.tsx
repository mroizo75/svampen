import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import WorkshopCalendarView from '@/components/workshop/workshop-calendar-view'

async function getBookings() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Hent bookinger fra i dag og fremover med kjøretøyinformasjon (ekskluder CANCELLED)
  const bookings = await prisma.booking.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay,
      },
      status: {
        in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'],
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
      company: {
        select: {
          name: true,
          orgNumber: true,
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
    orderBy: [
      { scheduledDate: 'asc' },
      { scheduledTime: 'asc' },
    ],
  })

  return bookings
}

async function getBusinessHours() {
  const settings = await prisma.adminSettings.findFirst()
  return {
    start: settings?.value || '08:00',
    end: settings?.value || '16:00',
  }
}

export default async function VerkstedPage() {
  const session = await getServerSession(authOptions)

  // Sjekk at brukeren er logget inn og har WORKSHOP eller ADMIN rolle
  if (!session || (session.user.role !== 'WORKSHOP' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const [bookings, businessHours] = await Promise.all([
    getBookings(),
    getBusinessHours(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Verksted Kalender</h1>
              <p className="text-sm text-gray-600 mt-1">
                Innlogget som: {session.user.firstName} {session.user.lastName} ({session.user.role === 'WORKSHOP' ? 'Verksted' : 'Admin'})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Dagens bestillinger</p>
              <p className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => {
                  const bookingDate = new Date(b.scheduledDate)
                  const today = new Date()
                  return bookingDate.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <WorkshopCalendarView
            bookings={bookings as any}
            businessHoursStart={businessHours.start}
            businessHoursEnd={businessHours.end}
          />
        </div>
      </main>

      {/* Auto-refresh notice */}
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
        🔄 Siden oppdaterer automatisk hvert 5. minutt
      </div>
    </div>
  )
}

