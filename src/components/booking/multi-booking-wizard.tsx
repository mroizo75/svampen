'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Car, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  AlertTriangle,
  Shield
} from 'lucide-react'
import { VehicleSelector } from './vehicle-selector'
import { ServiceSelector } from './service-selector'
import { CustomerInfoStep } from './customer-info-step'
import { DateTimeSelector } from './datetime-selector'
import { BookingSummary } from './booking-summary'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  category: 'MAIN' | 'ADDON' | 'SPECIAL'
  servicePrices: Array<{
    id: string
    price: number
    vehicleTypeId: string
  }>
}

interface VehicleType {
  id: string
  name: string
  description: string
}

interface BookingVehicle {
  id: string
  vehicleTypeId: string
  vehicleType?: VehicleType
  vehicleInfo: string
  vehicleNotes: string
  services: Array<{
    serviceId: string
    service?: Service
    quantity: number
    unitPrice: number
    totalPrice: number
    duration: number
  }>
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  createAccount: boolean
  password?: string
  isExistingUser: boolean
}

interface BookingData {
  vehicles: BookingVehicle[]
  customerInfo: CustomerInfo
  scheduledDate?: Date
  scheduledTime?: string
  customerNotes: string
  totalPrice: number
  totalDuration: number
}

interface MultiBookingWizardProps {
  services: Service[]
  vehicleTypes: VehicleType[]
  user?: any
  isAdminBooking?: boolean
  prefilledCustomerInfo?: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
}

export function MultiBookingWizard({ 
  services, 
  vehicleTypes, 
  user,
  isAdminBooking = false,
  prefilledCustomerInfo
}: MultiBookingWizardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    vehicles: [],
    customerInfo: {
      // For admin-bookinger: Kun bruk prefilledCustomerInfo, IKKE session/user data
      firstName: isAdminBooking 
        ? (prefilledCustomerInfo?.firstName || '') 
        : (prefilledCustomerInfo?.firstName || session?.user?.name || user?.firstName || ''),
      lastName: isAdminBooking 
        ? (prefilledCustomerInfo?.lastName || '') 
        : (prefilledCustomerInfo?.lastName || session?.user?.name || user?.lastName || ''),
      email: isAdminBooking 
        ? (prefilledCustomerInfo?.email || '') 
        : (prefilledCustomerInfo?.email || session?.user?.email || user?.email || ''),
      phone: isAdminBooking 
        ? (prefilledCustomerInfo?.phone || '') 
        : (prefilledCustomerInfo?.phone || session?.user?.phone || user?.phone || ''),
      createAccount: false,
      isExistingUser: isAdminBooking ? false : !!(session?.user || user),
    },
    customerNotes: '',
    totalPrice: 0,
    totalDuration: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maxAvailableMinutes, setMaxAvailableMinutes] = useState<number | null>(null)
  const [adminOverride, setAdminOverride] = useState(false)

  const calculateTotals = useCallback(() => {
    let totalPrice = 0
    let totalDuration = 0

    bookingData.vehicles.forEach(vehicle => {
      vehicle.services.forEach(service => {
        totalPrice += Number(service.totalPrice) || 0
        totalDuration += (Number(service.duration) || 0) * (Number(service.quantity) || 0)
      })
    })

    setBookingData(prev => ({
      ...prev,
      totalPrice: Number(totalPrice),
      totalDuration: Number(totalDuration),
    }))
  }, [bookingData.vehicles])

  // Beregn totaler når data endres
  useEffect(() => {
    calculateTotals()
  }, [calculateTotals])

  // Oppdater kunde info når session endres (f.eks. etter login)
  // IKKE for admin-bookinger - de skal manuelt fylle inn kundeinfo
  useEffect(() => {
    if (!isAdminBooking && session?.user && !bookingData.customerInfo.isExistingUser) {
      setBookingData(prev => ({
        ...prev,
        customerInfo: {
          firstName: session.user.name || prev.customerInfo.firstName,
          lastName: session.user.name || prev.customerInfo.lastName,
          email: session.user.email || prev.customerInfo.email,
          phone: session.user.phone || prev.customerInfo.phone,
          createAccount: false,
          isExistingUser: true,
        }
      }))
    }
  }, [session, bookingData.customerInfo.isExistingUser, isAdminBooking])

  // Sjekk for pre-valgt dato/tid fra kalender (quick booking)
  useEffect(() => {
    if (isAdminBooking) {
      const quickBookingDate = sessionStorage.getItem('quickBookingDate')
      const quickBookingTime = sessionStorage.getItem('quickBookingTime')
      
      if (quickBookingDate || quickBookingTime) {
        setBookingData(prev => ({
          ...prev,
          scheduledDate: quickBookingDate ? new Date(quickBookingDate) : prev.scheduledDate,
          scheduledTime: quickBookingTime || prev.scheduledTime,
        }))
        
        // Rydd opp sessionStorage
        sessionStorage.removeItem('quickBookingDate')
        sessionStorage.removeItem('quickBookingTime')
      }
    }
  }, [isAdminBooking])

  // Sjekk tilgjengelig tid når dato er valgt (for admin bookinger)
  useEffect(() => {
    const checkAvailability = async () => {
      if (isAdminBooking && bookingData.scheduledDate && !adminOverride) {
        try {
          const dateStr = bookingData.scheduledDate instanceof Date 
            ? bookingData.scheduledDate.toISOString().split('T')[0]
            : bookingData.scheduledDate

          const response = await fetch(`/api/availability/check?date=${dateStr}`)
          const data = await response.json()
          
          if (response.ok && data.maxAvailableMinutes !== undefined) {
            setMaxAvailableMinutes(data.maxAvailableMinutes)
          }
        } catch (error) {
          console.error('Error checking availability:', error)
        }
      } else if (adminOverride) {
        setMaxAvailableMinutes(null) // Nullstill begrensning ved override
      }
    }

    checkAvailability()
  }, [bookingData.scheduledDate, isAdminBooking, adminOverride])

  const addVehicle = () => {
    const newVehicle: BookingVehicle = {
      id: Date.now().toString(),
      vehicleTypeId: '',
      vehicleInfo: '',
      vehicleNotes: '',
      services: [],
    }
    
    setBookingData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle],
    }))
  }

  const removeVehicle = (vehicleId: string) => {
    setBookingData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== vehicleId),
    }))
  }

  const updateVehicle = (vehicleId: string, updates: Partial<BookingVehicle>) => {
    setBookingData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => 
        v.id === vehicleId ? { ...v, ...updates } : v
      ),
    }))
  }

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        const hasVehiclesAndServices = bookingData.vehicles.length > 0 && 
                                        bookingData.vehicles.every(v => v.vehicleTypeId && v.services.length > 0)
        
        // For admin bookinger: sjekk tilgjengelig tid (med mindre override er aktivert)
        if (isAdminBooking && maxAvailableMinutes !== null && !adminOverride) {
          return hasVehiclesAndServices && bookingData.totalDuration <= maxAvailableMinutes
        }
        
        return hasVehiclesAndServices
      case 3:
        return bookingData.customerInfo.firstName && 
               bookingData.customerInfo.lastName && 
               bookingData.customerInfo.email && 
               bookingData.customerInfo.phone
      case 4:
        return bookingData.scheduledDate && bookingData.scheduledTime
      case 5:
        return true
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Konverter Date til ISO string før sending
      const submissionData = {
        ...bookingData,
        scheduledDate: bookingData.scheduledDate instanceof Date 
          ? bookingData.scheduledDate.toISOString().split('T')[0]
          : bookingData.scheduledDate,
        isAdminBooking,
        adminOverride,
      }

      const response = await fetch('/api/multi-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      if (response.ok) {
        const booking = await response.json()
        
        // Redirect avhengig av om det er admin-booking eller kunde-booking
        if (isAdminBooking) {
          // Admin-booking: Gå tilbake til admin bestillingsoversikt med suksessmelding
          router.push(`/admin/bestillinger/${booking.id}?success=true`)
        } else {
          // Kunde-booking: Gå til offentlig bekreftelsesside
          router.push(`/bestill/bekreftelse?id=${booking.id}`)
        }
      } else {
        const data = await response.json()
        setError(data.message || 'En feil oppstod ved bestilling')
      }
    } catch (error) {
      setError('En feil oppstod. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Kjøretøy & Tjenester', icon: Car },
    { number: 2, title: 'Kunde informasjon', icon: Users },
    { number: 3, title: 'Dato & Tid', icon: Calendar },
    { number: 4, title: 'Bekreftelse', icon: CheckCircle },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className={`ml-3 text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-20 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            Steg {currentStep}: {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Legg til kjøretøy og velg tjenester for hver'}
            {currentStep === 2 && 'Oppgi dine kontaktopplysninger for bestillingen'}
            {currentStep === 3 && 'Velg ønsket dato og tid for hele bestillingen'}
            {currentStep === 4 && 'Bekreft din bestilling før den sendes inn'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tilgjengelig tid advarsel (kun for admin bookinger) */}
          {isAdminBooking && currentStep === 1 && maxAvailableMinutes !== null && (
            <Alert className={`mb-6 ${
              adminOverride 
                ? 'bg-green-50 border-green-300'
                : bookingData.totalDuration > maxAvailableMinutes 
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-blue-50 border-blue-300'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${
                adminOverride 
                  ? 'text-green-600'
                  : bookingData.totalDuration > maxAvailableMinutes ? 'text-orange-600' : 'text-blue-600'
              }`} />
              <AlertDescription>
                <div className="space-y-2">
                  {!adminOverride ? (
                    <>
                      <div className={
                        bookingData.totalDuration > maxAvailableMinutes ? 'text-orange-900' : 'text-blue-900'
                      }>
                        <strong>Tilgjengelig tid på valgt dato:</strong> {Math.floor(maxAvailableMinutes / 60)}t {maxAvailableMinutes % 60}min
                        {bookingData.totalDuration > 0 && (
                          <>
                            <br />
                            <strong>Valgt varighet:</strong> {Math.floor(bookingData.totalDuration / 60)}t {bookingData.totalDuration % 60}min
                          </>
                        )}
                      </div>
                      {bookingData.totalDuration > maxAvailableMinutes && (
                        <div className="text-orange-800 text-sm font-medium">
                          ⚠️ Varighet overskrider tilgjengelig tid med {Math.floor((bookingData.totalDuration - maxAvailableMinutes) / 60)}t {(bookingData.totalDuration - maxAvailableMinutes) % 60}min
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-green-900 font-medium">
                      🔓 Admin override aktivert - Alle tidsbegrensninger er overstyrte
                    </div>
                  )}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="adminOverride"
                      checked={adminOverride}
                      onCheckedChange={(checked) => setAdminOverride(!!checked)}
                    />
                    <Label
                      htmlFor="adminOverride"
                      className="text-sm font-medium cursor-pointer flex items-center"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Admin override - Tillat booking uansett tilgjengelig tid
                    </Label>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Vehicles & Services */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {bookingData.vehicles.map((vehicle, index) => (
                <Card key={vehicle.id} className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        Kjøretøy {index + 1}
                      </CardTitle>
                      {bookingData.vehicles.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <VehicleSelector
                      vehicleTypes={vehicleTypes}
                      selectedVehicleTypeId={vehicle.vehicleTypeId}
                      vehicleInfo={vehicle.vehicleInfo}
                      vehicleNotes={vehicle.vehicleNotes}
                      onVehicleTypeChange={(vehicleTypeId) => 
                        updateVehicle(vehicle.id, { vehicleTypeId })
                      }
                      onVehicleInfoChange={(vehicleInfo) => 
                        updateVehicle(vehicle.id, { vehicleInfo })
                      }
                      onVehicleNotesChange={(vehicleNotes) => 
                        updateVehicle(vehicle.id, { vehicleNotes })
                      }
                    />
                    
                    {vehicle.vehicleTypeId && (
                      <ServiceSelector
                        services={services}
                        vehicleTypeId={vehicle.vehicleTypeId}
                        selectedServices={vehicle.services}
                        onServicesChange={(services) => 
                          updateVehicle(vehicle.id, { services })
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={addVehicle}
                variant="outline"
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Legg til kjøretøy
              </Button>
            </div>
          )}

          {/* Step 2: Customer Info */}
          {currentStep === 2 && (
            <CustomerInfoStep
              customerInfo={bookingData.customerInfo}
              onCustomerInfoChange={(customerInfo) => 
                setBookingData(prev => ({ ...prev, customerInfo }))
              }
              isAdminBooking={isAdminBooking}
            />
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 3 && (
            <>
              {/* Admin override toggle - alltid synlig for admin */}
              {isAdminBooking && (
                <Alert className={`mb-6 ${
                  adminOverride 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <Shield className={`h-4 w-4 ${
                    adminOverride ? 'text-green-600' : 'text-blue-600'
                  }`} />
                  <AlertDescription>
                    <div className="space-y-2">
                      {adminOverride ? (
                        <div className="text-green-900 font-medium">
                          🔓 Admin override aktivert - Alle tidsbegrensninger er overstyrt
                        </div>
                      ) : (
                        <div className="text-blue-900">
                          <strong>Admin booking:</strong> Du kan aktivere override for å booke på opptatte tider
                        </div>
                      )}
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="adminOverrideStep3"
                          checked={adminOverride}
                          onCheckedChange={(checked) => setAdminOverride(!!checked)}
                        />
                        <Label
                          htmlFor="adminOverrideStep3"
                          className="text-sm font-medium cursor-pointer flex items-center"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Admin override - Tillat booking uansett tilgjengelig tid
                        </Label>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <DateTimeSelector
                selectedDate={bookingData.scheduledDate}
                selectedTime={bookingData.scheduledTime}
                totalDuration={bookingData.totalDuration}
                onDateChange={(date) => 
                  setBookingData(prev => ({ ...prev, scheduledDate: date }))
                }
                onTimeChange={(time) => 
                  setBookingData(prev => ({ ...prev, scheduledTime: time }))
                }
                isAdminBooking={isAdminBooking}
                adminOverride={adminOverride}
              />
            </>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <BookingSummary
              bookingData={bookingData}
              services={services}
              vehicleTypes={vehicleTypes}
              onNotesChange={(customerNotes) => 
                setBookingData(prev => ({ ...prev, customerNotes }))
              }
            />
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Forrige
        </Button>

        <div className="flex space-x-2">
          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToStep(currentStep + 1)}
            >
              Neste
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceedToStep(5)}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Sender bestilling...' : 'Bekreft bestilling'}
            </Button>
          )}
        </div>
      </div>

      {/* Price Summary */}
      {bookingData.totalPrice > 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total tid:</p>
                <p className="font-medium">
                  <Clock className="inline mr-1 h-4 w-4" />
                  {Math.floor(bookingData.totalDuration / 60)}t {bookingData.totalDuration % 60}min
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total pris:</p>
                <p className="text-2xl font-bold text-blue-600">
                  kr {Number(bookingData.totalPrice).toLocaleString()},-
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}