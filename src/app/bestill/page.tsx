'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { MultiBookingWizard } from '@/components/booking/multi-booking-wizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Car, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [services, setServices] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [servicesRes, vehicleTypesRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/vehicle-types')
      ])
      
      const servicesData = await servicesRes.json()
      const vehicleTypesData = await vehicleTypesRes.json()
      
      setServices(servicesData)
      setVehicleTypes(vehicleTypesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Laster booking system...</p>
          </div>
        </div>
      </MainLayout>
    )
  }



  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Bestill din time
                </CardTitle>
                <CardDescription>
                  Lag din bestilling ved å velge kjøretøy og tjenester. Du kan legge til flere kjøretøy og flere tjenester per kjøretøy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiBookingWizard 
                  services={services}
                  vehicleTypes={vehicleTypes}
                  user={session?.user}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Process Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Slik fungerer det
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Legg til kjøretøy</h4>
                    <p className="text-sm text-gray-600">Velg type kjøretøy og tjenester for hvert. Du kan legge til flere kjøretøy.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Kunde informasjon</h4>
                    <p className="text-sm text-gray-600">Oppgi dine kontaktopplysninger eller logg inn for raskere prosess</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Velg dato og tid</h4>
                    <p className="text-sm text-gray-600">Systemet finner ledig tid basert på total varighet av alle tjenester</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium">Bekreft bestilling</h4>
                    <p className="text-sm text-gray-600">Gjennomgå bestillingen og send inn for godkjenning</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">Viktig informasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertDescription>
                    <strong>Avbestilling:</strong> Timer som ikke blir benyttet eller ikke møtt vil bli fakturert 50%.
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Åpningstider:</strong><br />Mandag-Fredag: 08:00-16:00</p>
                  <p><strong>Hvor:</strong><br />Adresse kommer her</p>
                  <p>
                    <strong>Kontakt:</strong><br />
                    Telefon: <a href="tel:38347470" className="text-blue-600 hover:underline">38 34 74 70</a><br />
                    E-post: <a href="mailto:joachim@amento.no" className="text-blue-600 hover:underline">joachim@amento.no</a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Hvorfor velge Svampen?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-blue-700 space-y-3">
                  <div>
                    <p className="font-medium">⭐ 10+ års erfaring</p>
                    <p className="text-sm">Profesjonell kvalitet du kan stole på</p>
                  </div>
                  <div>
                    <p className="font-medium">💎 Konkurransedyktige priser</p>
                    <p className="text-sm">Kvalitet til rettferdig pris</p>
                  </div>
                  <div>
                    <p className="font-medium">⚡ Rask service</p>
                    <p className="text-sm">Effektiv håndtering av ditt kjøretøy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}