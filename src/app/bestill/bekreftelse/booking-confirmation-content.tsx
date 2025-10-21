'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Car, 
  Mail, 
  Phone,
  Home,
  User
} from 'lucide-react'
import Link from 'next/link'
import { AddToCalendar } from '@/components/booking/add-to-calendar'

export default function BookingConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('id')
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) {
      router.push('/bestill')
      return
    }

    // Prøv å hente booking-detaljer (fungerer både for innlogget og gjest)
    fetch(`/api/bookings/${bookingId}`)
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Could not fetch booking')
      })
      .then(data => setBooking(data))
      .catch(err => {
        console.error('Error fetching booking:', err)
        // Ikke kritisk - vi viser fortsatt suksess-melding
      })
      .finally(() => setLoading(false))
  }, [bookingId, router])

  if (!bookingId) {
    return null
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Bestillingen er mottatt!
          </h1>
          <p className="text-lg text-gray-600">
            Takk for din bestilling hos Svampen
          </p>
        </div>

        {/* What Happens Next */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900">
            <strong>Hva skjer nå?</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Du får en bekreftelse på e-post med alle detaljer</li>
              <li>Du får en SMS-påminelse dagen før behandlingen</li>
              <li>Du kan legge bookingen direkte i kalenderen din (se nedenfor)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Booking Details */}
        {loading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Henter bestillingsdetaljer...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && booking && (
          <>
            {/* Add to Calendar Button */}
            {booking && (
              <div className="mb-6">
                <AddToCalendar booking={booking} bookingId={bookingId} />
              </div>
            )}

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Bestillingsdetaljer</CardTitle>
                <CardDescription>Booking-ID: #{bookingId.substring(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dato</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.scheduledDate).toLocaleDateString('nb-NO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tidspunkt</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Kundeinformasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-2">
                      <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Navn</p>
                        <p className="text-sm text-gray-600">
                          {booking.user.firstName} {booking.user.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">E-post</p>
                        <p className="text-sm text-gray-600">{booking.user.email}</p>
                      </div>
                    </div>
                    {booking.user.phone && (
                      <div className="flex items-start space-x-2">
                        <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Telefon</p>
                          <p className="text-sm text-gray-600">{booking.user.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SMS Reminder Info */}
                <div className="border-t pt-4">
                  <div className="flex items-start space-x-2">
                    <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      <strong>SMS-påminelse:</strong> Du får en SMS-påminelse dagen før behandlingen.
                    </p>
                  </div>
                </div>

                {/* Vehicles and Services */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Kjøretøy og tjenester</h3>
                  <div className="space-y-4">
                    {booking.bookingVehicles.map((vehicle: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900">
                            Kjøretøy {idx + 1}: {vehicle.vehicleType.name}
                          </h4>
                        </div>
                        <ul className="space-y-1 ml-7">
                          {vehicle.bookingServices.map((bs: any, serviceIdx: number) => (
                            <li key={serviceIdx} className="text-sm text-gray-600">
                              {bs.service.name} - {bs.totalPrice.toFixed(0)} kr
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Price */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Totalpris</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {booking.totalPrice.toFixed(0)} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Til forsiden
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/bestill">
              <Calendar className="mr-2 h-5 w-5" />
              Book ny tid
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

