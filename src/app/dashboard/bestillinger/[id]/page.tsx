'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  MapPin,
  FileText 
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface BookingDetails {
  id: string
  scheduledDate: string
  scheduledTime: string
  estimatedEnd: string
  totalPrice: number
  totalDuration: number
  status: string
  customerNotes: string | null
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  bookingVehicles: Array<{
    id: string
    vehicleInfo: string | null
    vehicleNotes: string | null
    vehicleType: {
      name: string
      description: string | null
    }
    bookingServices: Array<{
      quantity: number
      unitPrice: number
      totalPrice: number
      duration: number
      service: {
        name: string
        description: string
      }
    }>
  }>
}

export default function BookingDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.id as string
  const success = searchParams.get('success')
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      } else {
        setError('Kunne ikke laste bestillingen')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError('En feil oppstod')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Venter på bekreftelse', variant: 'secondary' },
      CONFIRMED: { label: 'Bekreftet', variant: 'default' },
      IN_PROGRESS: { label: 'Pågår', variant: 'default' },
      COMPLETED: { label: 'Fullført', variant: 'outline' },
      CANCELLED: { label: 'Avbestilt', variant: 'destructive' },
      NO_SHOW: { label: 'Møtte ikke', variant: 'destructive' },
    }

    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant} className="text-sm px-3 py-1">{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Laster bestilling...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feil</CardTitle>
          <CardDescription>{error || 'Bestillingen ble ikke funnet'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/bestillinger">Tilbake til bestillinger</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Success Message */}
      {success === 'true' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Bestilling mottatt!</strong> Din bestilling er registrert og du vil motta en bekreftelse på e-post snart.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Bestillingsdetaljer</h1>
          <p className="text-gray-600 mt-2">Bestilling #{booking.id.substring(0, 8)}</p>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dato og tid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Dato:</span>
                <span className="font-medium">
                  {format(new Date(booking.scheduledDate), 'EEEE d. MMMM yyyy', { locale: nb })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start tid:</span>
                <span className="font-medium">{booking.scheduledTime.substring(11, 16)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimert ferdig:</span>
                <span className="font-medium">{booking.estimatedEnd.substring(11, 16)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Varighet:</span>
                <span className="font-medium">
                  {Math.floor(booking.totalDuration / 60)}t {booking.totalDuration % 60}min
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vehicles & Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Kjøretøy og tjenester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {booking.bookingVehicles.map((vehicle, idx) => (
                <div key={vehicle.id}>
                  {idx > 0 && <Separator className="my-6" />}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.vehicleType.name}</h3>
                      {vehicle.vehicleInfo && (
                        <p className="text-sm text-gray-600 mt-1">{vehicle.vehicleInfo}</p>
                      )}
                      {vehicle.vehicleNotes && (
                        <p className="text-sm text-gray-500 italic mt-1">{vehicle.vehicleNotes}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      {vehicle.bookingServices.map((service, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{service.service.name}</p>
                            <p className="text-sm text-gray-600">{service.service.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {service.duration} min {service.quantity > 1 && `× ${service.quantity}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">kr {Number(service.totalPrice).toLocaleString()},-</p>
                            {service.quantity > 1 && (
                              <p className="text-xs text-gray-500">
                                ({Number(service.unitPrice).toLocaleString()},- × {service.quantity})
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Merknader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{booking.customerNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Pris oversikt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-2xl font-bold text-blue-600">
                  <span>Total:</span>
                  <span>kr {Number(booking.totalPrice).toLocaleString()},-</span>
                </div>
                <p className="text-xs text-gray-600">Inkl. mva</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kontaktinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span>{booking.user.firstName} {booking.user.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{booking.user.email}</span>
              </div>
              {booking.user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{booking.user.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/bestillinger">Tilbake til bestillinger</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/bestill">Bestill ny tid</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

