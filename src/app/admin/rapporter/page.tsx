import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Car,
  Download,
  Filter,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PaginatedBookingsTable } from '@/components/admin/paginated-bookings-table'

async function getReportData() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Månedens statistikk
    const [monthlyBookings, lastMonthBookings, yearlyBookings] = await Promise.all([
      prisma.booking.findMany({
        where: {
          createdAt: { gte: startOfMonth },
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
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { gte: startOfYear },
        },
        include: {
          bookingVehicles: {
            include: {
              bookingServices: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      }),
    ])

    // Beregn månedlig omsetning
    const monthlyRevenue = monthlyBookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalPrice), 0)

    const lastMonthRevenue = lastMonthBookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalPrice), 0)

    // Tjeneste statistikk
    const serviceStats = yearlyBookings.reduce((acc, booking) => {
      booking.bookingVehicles.forEach(vehicle => {
        vehicle.bookingServices.forEach(bs => {
          const serviceName = bs.service.name
          if (!acc[serviceName]) {
            acc[serviceName] = { count: 0, revenue: 0 }
          }
          acc[serviceName].count++
          if (booking.status === 'COMPLETED') {
            acc[serviceName].revenue += Number(bs.totalPrice)
          }
        })
      })
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    // Månedens vekst
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0

    const bookingGrowth = lastMonthBookings.length > 0
      ? ((monthlyBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100
      : 0

    // Serialize Decimal to Number for client components
    const serializedMonthlyBookings = monthlyBookings.map(booking => ({
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

    const serializedYearlyBookings = yearlyBookings.map(booking => ({
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

    return {
      monthlyBookings: serializedMonthlyBookings,
      monthlyRevenue,
      revenueGrowth,
      bookingGrowth,
      serviceStats,
      yearlyBookings: serializedYearlyBookings,
    }
  } catch (error) {
    console.error('Error fetching report data:', error)
    return {
      monthlyBookings: [],
      monthlyRevenue: 0,
      revenueGrowth: 0,
      bookingGrowth: 0,
      serviceStats: {},
      yearlyBookings: [],
    }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Bekreftet</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="default" className="bg-purple-100 text-purple-800">Pågår</Badge>
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

export default async function AdminReportsPage() {
  const reportData = await getReportData()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapporter</h1>
          <p className="text-gray-600">Salgsstatistikk og analyse av forretningsdata</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter periode
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Eksporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlig omsetning</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr {reportData.monthlyRevenue.toLocaleString('nb-NO')}</div>
            <p className={`text-xs flex items-center ${
              reportData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="mr-1 h-3 w-3" />
              {reportData.revenueGrowth > 0 ? '+' : ''}{reportData.revenueGrowth.toFixed(1)}% fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlige bestillinger</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.monthlyBookings.length}</div>
            <p className={`text-xs flex items-center ${
              reportData.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="mr-1 h-3 w-3" />
              {reportData.bookingGrowth > 0 ? '+' : ''}{reportData.bookingGrowth.toFixed(1)}% fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Årlige bestillinger</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.yearlyBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Siden 1. januar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjennomsnitt per bestilling</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              kr {reportData.monthlyBookings.length > 0 
                ? Math.round(reportData.monthlyRevenue / reportData.monthlyBookings.length).toLocaleString('nb-NO')
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Denne måneden
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Tjeneste prestasjon</CardTitle>
            <CardDescription>Mest populære tjenester i år</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(reportData.serviceStats)
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, 5)
                .map(([serviceName, stats]) => (
                  <div key={serviceName} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{serviceName}</div>
                      <div className="text-sm text-gray-500">{stats.count} bestillinger</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">kr {stats.revenue.toLocaleString('nb-NO')}</div>
                      <div className="text-sm text-gray-500">omsetning</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Nylig aktivitet</CardTitle>
            <CardDescription>Siste bestillinger denne måneden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthlyBookings
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((booking) => {
                  const vehicleCount = booking.bookingVehicles.length
                  const serviceCount = booking.bookingVehicles.reduce((sum, v) => sum + v.bookingServices.length, 0)
                  
                  return (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {booking.user.firstName} {booking.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicleCount} kjøretøy • {serviceCount} tjenester
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">kr {booking.totalPrice.toLocaleString('nb-NO')}</div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monthly Report */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detaljert måneds rapport</CardTitle>
              <CardDescription>Alle bestillinger denne måneden ({reportData.monthlyBookings.length} totalt)</CardDescription>
            </div>
            <Select defaultValue="current-month">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Denne måneden</SelectItem>
                <SelectItem value="last-month">Forrige måned</SelectItem>
                <SelectItem value="current-year">Dette året</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reportData.monthlyBookings.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingen bestillinger denne måneden</p>
            </div>
          ) : (
            <PaginatedBookingsTable bookings={reportData.monthlyBookings} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}