'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, UserCheck } from 'lucide-react'
import { MultiBookingWizard } from '@/components/booking/multi-booking-wizard'

interface AdminBookingWizardProps {
  services: any[]
  vehicleTypes: any[]
  businessHoursStart?: string
  businessHoursEnd?: string
}

export default function AdminBookingWizard({ 
  services, 
  vehicleTypes, 
  businessHoursStart = '08:00',
  businessHoursEnd = '16:00' 
}: AdminBookingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<'customer' | 'booking'>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [existingCustomer, setExistingCustomer] = useState<{ id: string; firstName: string; lastName: string; email: string; phone: string | null } | null>(null)
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
        setStep('booking')
        sessionStorage.removeItem('quickBookingCustomer')
      } catch (e) {
        console.error('Error parsing quick booking data:', e)
      }
    }
  }, [])

  const lookupEmail = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setLookingUp(true)
    try {
      const res = await fetch(`/api/admin/customers?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setExistingCustomer(data.user)
          setCustomerInfo({
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            phone: data.user.phone || '',
          })
        } else {
          setExistingCustomer(null)
        }
      }
    } finally {
      setLookingUp(false)
    }
  }

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      setError('Vennligst fyll ut alle påkrevde felter')
      return
    }
    setStep('booking')
    setError(null)
  }

  if (step === 'booking') {
    return (
      <div className="space-y-6">
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

        <MultiBookingWizard 
          services={services}
          vehicleTypes={vehicleTypes}
          isAdminBooking={true}
          prefilledCustomerInfo={customerInfo}
          businessHoursStart={businessHoursStart}
          businessHoursEnd={businessHoursEnd}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleCustomerSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Kundeinformasjon</h3>
        <p className="text-sm text-gray-600">
          Skriv inn e-post – eksisterende kunder fylles ut automatisk.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">
              E-post <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, email: e.target.value })
                  setExistingCustomer(null)
                }}
                onBlur={(e) => lookupEmail(e.target.value)}
                placeholder="ola@example.com"
                required
              />
              {lookingUp && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            {existingCustomer && (
              <Alert className="bg-green-50 border-green-200 py-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  Eksisterende kunde funnet – informasjon fylt inn automatisk.
                </AlertDescription>
              </Alert>
            )}
          </div>

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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phone">Telefon</Label>
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
          <Button type="submit" disabled={isLoading || lookingUp}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fortsett til booking
          </Button>
        </div>
      </div>
    </form>
  )
}

