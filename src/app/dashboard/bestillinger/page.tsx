'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Car, MapPin } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface Booking {
  id: string
  scheduledDate: string
  scheduledTime: string
  totalPrice: number
  totalDuration: number
  status: string
  bookingVehicles: Array<{
    vehicleType: {
      name: string
    }
    bookingServices: Array<{
      service: {
        name: string
      }
    }>
  }>
}

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookings()
    }
  }, [status])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Venter', variant: 'secondary' },
      CONFIRMED: { label: 'Bekreftet', variant: 'default' },
      IN_PROGRESS: { label: 'Pågår', variant: 'default' },
      COMPLETED: { label: 'Fullført', variant: 'outline' },
      CANCELLED: { label: 'Avbestilt', variant: 'destructive' },
      NO_SHOW: { label: 'Møtte ikke', variant: 'destructive' },
    }

    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Laster bestillinger...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Du må logge inn</CardTitle>
          <CardDescription>Logg inn for å se dine bestillinger</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Logg inn</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mine bestillinger</h1>
        <p className="text-gray-600 mt-2">Oversikt over dine tidligere og kommende bestillinger</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ingen bestillinger</CardTitle>
            <CardDescription>Du har ikke gjort noen bestillinger ennå</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/bestill">Bestill tid nå</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(new Date(booking.scheduledDate), 'EEEE d. MMMM yyyy', { locale: nb })}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4" />
                      Kl. {booking.scheduledTime.substring(11, 16)} ({Math.floor(booking.totalDuration / 60)}t {booking.totalDuration % 60}min)
                    </CardDescription>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.bookingVehicles.map((vehicle, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Car className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{vehicle.vehicleType.name}</p>
                        <p className="text-gray-600">
                          {vehicle.bookingServices.map(bs => bs.service.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <p className="text-lg font-bold text-blue-600">
                      kr {Number(booking.totalPrice).toLocaleString()},-
                    </p>
                    <Button asChild variant="outline">
                      <Link href={`/dashboard/bestillinger/${booking.id}`}>
                        Se detaljer
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

