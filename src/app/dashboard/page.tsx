import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  Car,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { getServerAuthSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

async function getUserBookings(userId: string) {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId,
      },
      include: {
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
      take: 5, // Vis bare de siste 5
    })

    // Serialize Decimal to Number for client components
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
    console.error('Error fetching user bookings:', error)
    return []
  }
}

async function getUserStats(userId: string) {
  try {
    const total = await prisma.booking.count({
      where: { userId },
    })

    const completed = await prisma.booking.count({
      where: { 
        userId,
        status: 'COMPLETED'
      },
    })

    const upcoming = await prisma.booking.count({
      where: {
        userId,
        scheduledDate: {
          gte: new Date(),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    })

    const totalSpent = await prisma.booking.aggregate({
      where: {
        userId,
        status: {
          in: ['COMPLETED', 'CONFIRMED'],
        },
      },
      _sum: {
        totalPrice: true,
      },
    })

    return {
      total,
      completed,
      upcoming,
      totalSpent: Number(totalSpent._sum.totalPrice) || 0,
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      total: 0,
      completed: 0,
      upcoming: 0,
      totalSpent: 0,
    }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Venter på bekreftelse</Badge>
    case 'CONFIRMED':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Bekreftet</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="default" className="bg-green-100 text-green-800">Pågår</Badge>
    case 'COMPLETED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Fullført</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive">Avbestilt</Badge>
    case 'NO_SHOW':
      return <Badge variant="destructive">Møtte ikke</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function DashboardPage() {
  const session = await getServerAuthSession()
  
  if (!session?.user?.id) {
    return null // Middleware will handle redirect
  }
  
  const bookings = await getUserBookings(session.user.id)
  const stats = await getUserStats(session.user.id)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Velkommen, {session.user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">Her er en oversikt over dine bestillinger hos Svampen</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale bestillinger</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All tid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fullførte</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Gjennomførte vasker
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kommende</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              Planlagte vasker
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt brukt</CardTitle>
            <Car className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr {stats.totalSpent.toLocaleString('nb-NO')}</div>
            <p className="text-xs text-muted-foreground">
              Denne måneden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtighandlinger</CardTitle>
          <CardDescription>Hva vil du gjøre i dag?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="justify-start h-auto p-4">
              <Link href="/bestill" className="flex items-center space-x-3">
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Bestill ny time</div>
                  <div className="text-sm text-muted-foreground">Book din neste vask</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start h-auto p-4">
              <Link href="/dashboard/bestillinger" className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Se alle bestillinger</div>
                  <div className="text-sm text-muted-foreground">Administrer dine bookinger</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Siste bestillinger</CardTitle>
              <CardDescription>Oversikt over dine nyeste bookinger</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/bestillinger">Se alle</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Du har ingen bestillinger ennå</p>
              <Button asChild>
                <Link href="/bestill">
                  <Plus className="mr-2 h-4 w-4" />
                  Bestill din første vask
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const vehicleCount = booking.bookingVehicles.length
                const serviceCount = booking.bookingVehicles.reduce((sum, v) => sum + v.bookingServices.length, 0)
                const vehicleNames = booking.bookingVehicles.map(v => v.vehicleType.name).join(', ')
                
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {vehicleCount} {vehicleCount === 1 ? 'kjøretøy' : 'kjøretøy'} • {serviceCount} {serviceCount === 1 ? 'tjeneste' : 'tjenester'}
                        </p>
                        <p className="text-sm text-gray-600">{vehicleNames}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleDateString('nb-NO')} kl. {new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(booking.status)}
                      <span className="font-semibold">kr {booking.totalPrice.toLocaleString('nb-NO')}</span>
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