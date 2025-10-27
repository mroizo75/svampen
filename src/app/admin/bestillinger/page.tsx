import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle, Clock, Filter } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BookingsTable from '@/components/admin/bookings-table'

const ITEMS_PER_PAGE = 20

async function getBookings(page: number = 1) {
  try {
    const skip = (page - 1) * ITEMS_PER_PAGE
    
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        include: {
          user: true,
          company: true,  // Inkluder bedriftsinformasjon
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
      }),
      prisma.booking.count(),
    ])
    
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
    
    return {
      bookings: serializedBookings,
      totalCount,
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      currentPage: page,
    }
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return {
      bookings: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    }
  }
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const { bookings, totalCount, totalPages, currentPage } = await getBookings(page)

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bestillinger</h1>
          <p className="text-gray-600">Administrer alle bookinger og deres status</p>
        </div>
        <Button asChild>
          <Link href="/admin/bestillinger/ny">
            <Calendar className="mr-2 h-4 w-4" />
            Ny bestilling
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venter på bekreftelse</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekreftede</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fullførte</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Alle bestillinger</CardTitle>
              <CardDescription>Oversikt over alle bookinger i systemet (klikk på en rad for å se detaljer)</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Ingen bestillinger funnet</p>
            </div>
          ) : (
            <BookingsTable bookings={bookings} />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Viser {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} av {totalCount} bestillinger
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  asChild={currentPage !== 1}
                >
                  {currentPage === 1 ? (
                    <span>Forrige</span>
                  ) : (
                    <Link href={`/admin/bestillinger?page=${currentPage - 1}`}>
                      Forrige
                    </Link>
                  )}
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        asChild={currentPage !== pageNum}
                      >
                        {currentPage === pageNum ? (
                          <span>{pageNum}</span>
                        ) : (
                          <Link href={`/admin/bestillinger?page=${pageNum}`}>
                            {pageNum}
                          </Link>
                        )}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  asChild={currentPage !== totalPages}
                >
                  {currentPage === totalPages ? (
                    <span>Neste</span>
                  ) : (
                    <Link href={`/admin/bestillinger?page=${currentPage + 1}`}>
                      Neste
                    </Link>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}