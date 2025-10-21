'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { MultiBookingWizard } from '@/components/booking/multi-booking-wizard'

interface AdminBookingWizardProps {
  services: any[]
  vehicleTypes: any[]
}

export default function AdminBookingWizard({ services, vehicleTypes }: AdminBookingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<'customer' | 'booking'>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })

  // Sjekk for quick booking data fra kalender
  useEffect(() => {
    const quickBookingCustomer = sessionStorage.getItem('quickBookingCustomer')
    if (quickBookingCustomer) {
      try {
        const parsedCustomer = JSON.parse(quickBookingCustomer)
        setCustomerInfo(parsedCustomer)
        // Gå automatisk til booking-steget
        setStep('booking')
        // Rydd opp sessionStorage
        sessionStorage.removeItem('quickBookingCustomer')
      } catch (error) {
        console.error('Error parsing quick booking data:', error)
      }
    }
  }, [])

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validering
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      setError('Vennligst fyll ut alle påkrevde felter')
      return
    }

    // Gå videre til booking-steg
    setStep('booking')
    setError(null)
  }

  if (step === 'booking') {
    return (
      <div className="space-y-6">
        {/* Kundeinfo visning */}
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Booking for:</strong> {customerInfo.firstName} {customerInfo.lastName} ({customerInfo.email})
            <Button
              variant="link"
              size="sm"
              className="ml-2 h-auto p-0 text-blue-600"
              onClick={() => setStep('customer')}
            >
              Endre kunde
            </Button>
          </AlertDescription>
        </Alert>

        {/* Booking wizard med forhåndsutfylt kundeinfo */}
        <MultiBookingWizard 
          services={services}
          vehicleTypes={vehicleTypes}
          isAdminBooking={true}
          prefilledCustomerInfo={customerInfo}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleCustomerSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Kundeinformasjon</h3>
        <p className="text-sm text-gray-600">
          Fyll ut kundens informasjon. Systemet vil automatisk opprette en bruker hvis e-postadressen ikke finnes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              Fornavn <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={customerInfo.firstName}
              onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
              placeholder="Ola"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Etternavn <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={customerInfo.lastName}
              onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
              placeholder="Nordmann"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              E-post <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              placeholder="ola@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Telefon
            </Label>
            <Input
              id="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="+47 XXX XX XXX"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/bestillinger')}
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fortsett til booking
          </Button>
        </div>
      </div>
    </form>
  )
}

