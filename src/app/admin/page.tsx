import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Users,
  Car,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getDashboardStats() {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  try {
    // Dagens statistikk
    const todayBookings = await prisma.booking.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    const todayCompleted = await prisma.booking.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
    })

    // Månedlig statistikk
    const monthlyBookings = await prisma.booking.count({
      where: {
        scheduledDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    const monthlyRevenue = await prisma.booking.aggregate({
      where: {
        scheduledDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ['COMPLETED', 'CONFIRMED'],
        },
      },
      _sum: {
        totalPrice: true,
      },
    })

    // Aktive kunder
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'USER',
      },
    })

    // Kommende bestillinger
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: new Date(),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
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
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 5,
    })

    return {
      todayBookings,
      todayCompleted,
      monthlyBookings,
      monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
      totalCustomers,
      upcomingBookings,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      todayBookings: 0,
      todayCompleted: 0,
      monthlyBookings: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      upcomingBookings: [],
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Oversikt over Svampen's bookinger og aktivitet</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dagens bestillinger</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCompleted} fullført
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlige bestillinger</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyBookings}</div>
            <p className="text-xs text-muted-foreground">
              Denne måneden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlig omsetning</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr {stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Denne måneden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale kunder</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registrerte brukere
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtighandlinger</CardTitle>
          <CardDescription>Vanlige administrative oppgaver</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="justify-start h-auto p-4">
              <Link href="/admin/bestillinger" className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Se alle bestillinger</div>
                  <div className="text-sm text-muted-foreground">Administrer bookinger</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start h-auto p-4">
              <Link href="/admin/timeplan" className="flex items-center space-x-3">
                <Clock className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Administrer timeplan</div>
                  <div className="text-sm text-muted-foreground">Sett åpningstider</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start h-auto p-4">
              <Link href="/admin/kunder" className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Se kunder</div>
                  <div className="text-sm text-muted-foreground">Kundeoversikt</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Kommende bestillinger</CardTitle>
          <CardDescription>De nærmeste 5 bestillingene</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.upcomingBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen kommende bestillinger</p>
          ) : (
            <div className="space-y-4">
              {stats.upcomingBookings.map((booking) => {
                const vehicleCount = booking.bookingVehicles.length
                const firstVehicle = booking.bookingVehicles[0]
                const serviceCount = booking.bookingVehicles.reduce((sum, v) => sum + v.bookingServices.length, 0)
                
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.user.firstName} {booking.user.lastName}</p>
                        <p className="text-sm text-gray-600">
                          {vehicleCount} {vehicleCount === 1 ? 'kjøretøy' : 'kjøretøy'} • {serviceCount} {serviceCount === 1 ? 'tjeneste' : 'tjenester'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleDateString('nb-NO')} kl. {new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}
                      >
                        {booking.status === 'PENDING' && 'Venter'}
                        {booking.status === 'CONFIRMED' && 'Bekreftet'}
                      </Badge>
                      <span className="font-semibold">kr {booking.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}