import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Edit,
  User
} from 'lucide-react'
import Link from 'next/link'
import { EditCustomerForm } from '@/components/admin/edit-customer-form'

async function getCustomer(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
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
          createdAt: 'desc',
        },
      },
    },
  })
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'ADMIN':
      return <Badge variant="default" className="bg-purple-100 text-purple-800">Admin</Badge>
    case 'USER':
      return <Badge variant="secondary">Kunde</Badge>
    case 'WORKSHOP':
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Verksted</Badge>
    case 'ANSATT':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Ansatt</Badge>
    default:
      return <Badge variant="secondary">{role}</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Bekreftet</Badge>
    case 'COMPLETED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Fullført</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive">Avbestilt</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pågår</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function CustomerDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  const totalBookings = customer.bookings.length
  const completedBookings = customer.bookings.filter(b => b.status === 'COMPLETED').length
  const totalSpent = customer.bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalPrice), 0)

  const isEditMode = edit === 'true'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/admin/kunder">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-gray-600">Kundedetaljer</p>
          </div>
        </div>
        {!isEditMode && (
          <Button asChild>
            <Link href={`/admin/kunder/${customer.id}?edit=true`}>
              <Edit className="mr-2 h-4 w-4" />
              Rediger kunde
            </Link>
          </Button>
        )}
      </div>

      {isEditMode ? (
        <EditCustomerForm customer={customer} />
      ) : (
        <>
          {/* Customer Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Totale bestillinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  {completedBookings} fullført
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Totalt brukt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  kr {totalSpent.toLocaleString('nb-NO')}
                </div>
                <p className="text-xs text-muted-foreground">Fullførte bestillinger</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Medlem siden</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(customer.createdAt).toLocaleDateString('nb-NO', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dager
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Kundeinformasjon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Navn</p>
                  <p className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail className="mr-2 h-3 w-3" />
                    E-post
                  </p>
                  <p className="font-medium">{customer.email}</p>
                </div>

                {customer.phone && (
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone className="mr-2 h-3 w-3" />
                      Telefon
                    </p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}

                {(customer.address || customer.postalCode || customer.city) && (
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="mr-2 h-3 w-3" />
                      Adresse
                    </p>
                    {customer.address && (
                      <p className="font-medium">{customer.address}</p>
                    )}
                    {(customer.postalCode || customer.city) && (
                      <p className="font-medium">
                        {customer.postalCode} {customer.city}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Rolle</p>
                  <div className="mt-1">{getRoleBadge(customer.role)}</div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Calendar className="mr-2 h-3 w-3" />
                    Registrert
                  </p>
                  <p className="font-medium">
                    {new Date(customer.createdAt).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Bestillingshistorikk</CardTitle>
                <CardDescription>
                  {totalBookings} bestilling{totalBookings !== 1 ? 'er' : ''} totalt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.bookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Ingen bestillinger ennå</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customer.bookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/admin/bestillinger/${booking.id}`}
                        className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {new Date(booking.scheduledDate).toLocaleDateString('nb-NO')}
                            </span>
                            {getStatusBadge(booking.status)}
                          </div>
                          <span className="font-semibold text-blue-600">
                            kr {Number(booking.totalPrice).toLocaleString('nb-NO')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.bookingVehicles.map((bv, idx) => (
                            <div key={bv.id}>
                              {bv.vehicleType.name} -{' '}
                              {bv.bookingServices.map(bs => bs.service.name).join(', ')}
                            </div>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

