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
  Shield,
  Info,
  Building2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
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
  category: 'MAIN' | 'ADDON' | 'SPECIAL' | 'DEALER'
  isAdminOnly?: boolean
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
  address?: string
  postalCode?: string
  city?: string
  createAccount: boolean
  password?: string
  isExistingUser: boolean
}

interface BookingData {
  vehicles: BookingVehicle[]
  customerInfo: CustomerInfo
  companyId?: string  // Bedriftsbooking
  scheduledDate?: Date
  scheduledTime?: string
  customerNotes: string
  totalPrice: number
  totalDuration: number
  isAdminBooking?: boolean
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
  businessHoursStart?: string
  businessHoursEnd?: string
}

export function MultiBookingWizard({ 
  services, 
  vehicleTypes, 
  user,
  isAdminBooking = false,
  prefilledCustomerInfo,
  businessHoursStart = '08:00',
  businessHoursEnd = '16:00'
}: MultiBookingWizardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(isAdminBooking ? 0 : 1) // Start på steg 0 for admin
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
      address: isAdminBooking ? '' : (user?.address || ''),
      postalCode: isAdminBooking ? '' : (user?.postalCode || ''),
      city: isAdminBooking ? '' : (user?.city || ''),
      createAccount: false,
      isExistingUser: isAdminBooking ? false : !!(session?.user || user),
    },
    companyId: undefined,
    customerNotes: '',
    totalPrice: 0,
    totalDuration: 0,
    isAdminBooking,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maxAvailableMinutes, setMaxAvailableMinutes] = useState<number | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [customerType, setCustomerType] = useState<'private' | 'company'>('private') // Ny state for kundetype
  const [adminOverride, setAdminOverride] = useState(false)
  const [sendSms, setSendSms] = useState(true) // Default til å sende SMS

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
          address: prev.customerInfo.address,
          postalCode: prev.customerInfo.postalCode,
          city: prev.customerInfo.city,
          createAccount: false,
          isExistingUser: true,
        }
      }))
    }
  }, [session, bookingData.customerInfo.isExistingUser, isAdminBooking])

  // Hent bedrifter hvis admin-booking
  useEffect(() => {
    if (isAdminBooking) {
      fetch('/api/admin/companies?activeOnly=true')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCompanies(data)
          }
        })
        .catch(err => console.error('Error fetching companies:', err))
    }
  }, [isAdminBooking])

  // Oppdater kundeinformasjon når bedrift velges
  useEffect(() => {
    if (selectedCompany && customerType === 'company') {
      setBookingData(prev => ({
        ...prev,
        companyId: selectedCompany.id,
        customerInfo: {
          ...prev.customerInfo,
          email: selectedCompany.contactEmail,
          phone: selectedCompany.contactPhone || '',
          firstName: selectedCompany.contactPerson?.firstName || '',
          lastName: selectedCompany.contactPerson?.lastName || '',
          address: selectedCompany.address || '',
          postalCode: selectedCompany.postalCode || '',
          city: selectedCompany.city || '',
        }
      }))
    }
  }, [selectedCompany, customerType])

  // Sjekk for pre-valgt dato/tid fra kalender (quick booking)
  useEffect(() => {
    if (isAdminBooking) {
      const quickBookingDate = sessionStorage.getItem('quickBookingDate')
      const quickBookingTime = sessionStorage.getItem('quickBookingTime')
      
      if (quickBookingDate || quickBookingTime) {
        setBookingData(prev => {
          const updates: any = {}
          
          if (quickBookingDate) {
            updates.scheduledDate = new Date(quickBookingDate + 'T00:00:00')
          }
          if (quickBookingTime) {
            updates.scheduledTime = quickBookingTime
          }
          
          return { ...prev, ...updates }
        })
        
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
          // Konverter Date til lokal dato-string uten timezone-konvertering
          let dateStr: string
          if (bookingData.scheduledDate instanceof Date) {
            const year = bookingData.scheduledDate.getFullYear()
            const month = String(bookingData.scheduledDate.getMonth() + 1).padStart(2, '0')
            const day = String(bookingData.scheduledDate.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else {
            dateStr = bookingData.scheduledDate
          }

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
    if (isAdminBooking) {
      // Admin flow: 0 (velg kunde) -> 1 (kjøretøy) -> 2 (dato/tid) -> 3 (bekreftelse)
      switch (step) {
        case 1: // Fra steg 0 til 1
          // Må ha valgt kundetype og fylt inn/valgt kunde
          if (customerType === 'company') {
            return !!selectedCompany
          } else {
            // Må ha navn OG enten e-post eller telefon
            return bookingData.customerInfo.firstName && 
                   bookingData.customerInfo.lastName && 
                   (bookingData.customerInfo.email || bookingData.customerInfo.phone)
          }
        case 2: // Fra steg 1 til 2
          const hasVehiclesAndServices = bookingData.vehicles.length > 0 && 
                                          bookingData.vehicles.every(v => v.vehicleTypeId && v.services.length > 0)
          
          // Sjekk tilgjengelig tid (med mindre override er aktivert)
          if (maxAvailableMinutes !== null && !adminOverride) {
            return hasVehiclesAndServices && bookingData.totalDuration <= maxAvailableMinutes
          }
          
          return hasVehiclesAndServices
        case 3: // Fra steg 2 til 3
          return bookingData.scheduledDate && bookingData.scheduledTime
        case 4: // Fra steg 3 til submit
          return true
        default:
          return true
      }
    } else {
      // Normal flow: 1 (kjøretøy) -> 2 (kundeinfo) -> 3 (dato/tid) -> 4 (bekreftelse)
      switch (step) {
        case 2: // Fra steg 1 til 2
          return bookingData.vehicles.length > 0 && 
                 bookingData.vehicles.every(v => v.vehicleTypeId && v.services.length > 0)
        case 3: // Fra steg 2 til 3
          // For kundebestillinger: E-post er PÅKREVD
          return bookingData.customerInfo.firstName && 
                 bookingData.customerInfo.lastName && 
                 bookingData.customerInfo.email && 
                 bookingData.customerInfo.email.trim() !== ''
        case 4: // Fra steg 3 til 4
          return bookingData.scheduledDate && bookingData.scheduledTime
        case 5: // Fra steg 4 til submit
          return true
        default:
          return true
      }
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Konverter Date til lokal dato-string (YYYY-MM-DD) uten timezone-konvertering
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const submissionData = {
        ...bookingData,
        scheduledDate: bookingData.scheduledDate instanceof Date 
          ? formatLocalDate(bookingData.scheduledDate)
          : bookingData.scheduledDate,
        isAdminBooking,
        adminOverride,
        sendSms: isAdminBooking ? sendSms : undefined, // Kun send flagget for admin-bookinger
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

  const steps = isAdminBooking 
    ? [
        { number: 0, title: 'Velg kunde', icon: Users },
        { number: 1, title: 'Kjøretøy & Tjenester', icon: Car },
        { number: 2, title: 'Dato & Tid', icon: Calendar },
        { number: 3, title: 'Bekreftelse', icon: CheckCircle },
      ]
    : [
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

      {/* Quick Booking Customer Info Banner - vises når man har hoppet over steg 0 */}
      {isAdminBooking && currentStep > 0 && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <strong>Booking for:</strong>{' '}
                {customerType === 'company' && selectedCompany ? (
                  <>
                    <span className="font-semibold">{selectedCompany.name}</span>
                    {' '}({selectedCompany.contactEmail})
                    {selectedCompany.discountPercent > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedCompany.discountPercent}% rabatt
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    {bookingData.customerInfo.firstName} {bookingData.customerInfo.lastName}
                    {' '}({bookingData.customerInfo.email})
                  </>
                )}
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600"
                onClick={() => setCurrentStep(0)}
              >
                Endre kunde
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">
              {isAdminBooking ? currentStep + 1 : currentStep}
            </span>
            Steg {isAdminBooking ? currentStep + 1 : currentStep}: {steps.find(s => s.number === currentStep)?.title}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && 'Velg om dette er en privat- eller bedriftsbooking'}
            {currentStep === 1 && 'Legg til kjøretøy og velg tjenester for hver'}
            {currentStep === 2 && (isAdminBooking ? 'Velg ønsket dato og tid for hele bestillingen' : 'Oppgi dine kontaktopplysninger for bestillingen')}
            {currentStep === 3 && (isAdminBooking ? 'Bekreft din bestilling før den sendes inn' : 'Velg ønsket dato og tid for hele bestillingen')}
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

          {/* Step 0: Customer Type Selection (Admin Only) */}
          {isAdminBooking && currentStep === 0 && (
            <div className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Velg kundetype først:</strong> Dette avgjør om bookingen knyttes til en bedrift med fasteavtale eller en privatkunde.
                </AlertDescription>
              </Alert>

              {/* Kundetype Valg */}
              <Card>
                <CardHeader>
                  <CardTitle>Kundetype</CardTitle>
                  <CardDescription>Velg om dette er en bedrifts- eller privat booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerType('private')
                        setSelectedCompany(null)
                        setBookingData(prev => ({
                          ...prev,
                          companyId: undefined,
                          customerInfo: {
                            ...prev.customerInfo,
                            firstName: prefilledCustomerInfo?.firstName || '',
                            lastName: prefilledCustomerInfo?.lastName || '',
                            email: prefilledCustomerInfo?.email || '',
                            phone: prefilledCustomerInfo?.phone || '',
                            address: '',
                            postalCode: '',
                            city: '',
                          }
                        }))
                      }}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        customerType === 'private'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <Users className="h-6 w-6 mr-3 text-blue-600" />
                        <h3 className="font-semibold text-lg">Privatkunde</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Vanlig kunde som betaler ordinære priser. Fyll inn kundeopplysninger manuelt.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerType('company')
                      }}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        customerType === 'company'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <Building2 className="h-6 w-6 mr-3 text-purple-600" />
                        <h3 className="font-semibold text-lg">Bedriftskunde</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Bedrift med fasteavtale. Velg fra eksisterende bedrifter med spesialpriser og vilkår.
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Bedriftsvalg */}
              {customerType === 'company' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5" />
                      Velg bedrift
                    </CardTitle>
                    <CardDescription>
                      Velg hvilken bedrift denne bookingen er for
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {companies.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Ingen aktive bedrifter funnet. <Link href="/admin/bedriftskunder" className="underline">Legg til bedrift først</Link>.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="company-select">Bedrift *</Label>
                          <select
                            id="company-select"
                            value={selectedCompany?.id || ''}
                            onChange={(e) => {
                              const company = companies.find(c => c.id === e.target.value)
                              setSelectedCompany(company || null)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">-- Velg bedrift --</option>
                            {companies.map(company => (
                              <option key={company.id} value={company.id}>
                                {company.name} {company.discountPercent > 0 && `(${company.discountPercent}% rabatt)`}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {selectedCompany && (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              <div className="space-y-2">
                                <div className="font-medium text-lg">{selectedCompany.name}</div>
                                {selectedCompany.orgNumber && (
                                  <div className="text-sm">Org.nr: {selectedCompany.orgNumber}</div>
                                )}
                                <div className="text-sm">
                                  <strong>Kontakt:</strong> {selectedCompany.contactEmail}
                                  {selectedCompany.contactPhone && ` • ${selectedCompany.contactPhone}`}
                                </div>
                                {selectedCompany.discountPercent > 0 && (
                                  <div className="text-sm font-medium">
                                    ✅ Rabatt: {selectedCompany.discountPercent}%
                                  </div>
                                )}
                                {selectedCompany.paymentTerms && (
                                  <div className="text-sm">
                                    Betalingsvilkår: {selectedCompany.paymentTerms}
                                  </div>
                                )}
                                {selectedCompany.specialTerms && (
                                  <div className="text-sm text-gray-700 mt-2 pt-2 border-t border-green-300">
                                    <strong>Spesielle vilkår:</strong><br />
                                    {selectedCompany.specialTerms}
                                  </div>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Privatkunde-info */}
              {customerType === 'private' && (
                <CustomerInfoStep
                  customerInfo={bookingData.customerInfo}
                  onCustomerInfoChange={(customerInfo) => 
                    setBookingData(prev => ({ ...prev, customerInfo }))
                  }
                  isAdminBooking={isAdminBooking}
                />
              )}
            </div>
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
                        isAdminBooking={isAdminBooking}
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

          {/* Step 2: Date & Time (Admin) eller Customer Info (Normal) */}
          {currentStep === 2 && (
            <>
              {!isAdminBooking ? (
                // For normale kunder: Kundeinformasjon
                <CustomerInfoStep
                  customerInfo={bookingData.customerInfo}
                  onCustomerInfoChange={(customerInfo) => 
                    setBookingData(prev => ({ ...prev, customerInfo }))
                  }
                  isAdminBooking={false}
                />
              ) : (
                // For admin: Dato & Tid (tidligere steg 3)
                <>
                  {/* Admin override toggle - alltid synlig for admin */}
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
                            id="adminOverrideStep2"
                            checked={adminOverride}
                            onCheckedChange={(checked) => setAdminOverride(!!checked)}
                          />
                          <Label
                            htmlFor="adminOverrideStep2"
                            className="text-sm font-medium cursor-pointer flex items-center"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Admin override - Tillat booking uansett tilgjengelig tid
                          </Label>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <DateTimeSelector
                    selectedDate={bookingData.scheduledDate}
                    selectedTime={bookingData.scheduledTime}
                    totalDuration={bookingData.totalDuration}
                    onDateChange={(date) => setBookingData(prev => ({ ...prev, scheduledDate: date }))}
                    onTimeChange={(time) => setBookingData(prev => ({ ...prev, scheduledTime: time }))}
                    isAdminBooking={isAdminBooking}
                    adminOverride={adminOverride}
                    businessHoursStart={businessHoursStart}
                    businessHoursEnd={businessHoursEnd}
                  />

                  {/* SMS-valg for admin */}
                  <Alert className="mt-6 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="sendSms"
                          checked={sendSms}
                          onChange={(e) => setSendSms(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <label htmlFor="sendSms" className="cursor-pointer font-medium">
                            Send SMS-bekreftelse til kunde
                          </label>
                          <p className="text-sm text-blue-700 mt-1">
                            SMS sendes kun til mobilnummer (starter med 4 eller 9). 
                            {bookingData.customerInfo.phone && (
                              <>
                                {' '}Telefonnummer: <strong>{bookingData.customerInfo.phone}</strong>
                                {(() => {
                                  // Samme validering som backend: fjern +47, 47 prefix og spesialtegn
                                  let phoneDigits = bookingData.customerInfo.phone.replace(/[\s\-()]/g, '')
                                  if (phoneDigits.startsWith('+47')) {
                                    phoneDigits = phoneDigits.substring(3)
                                  } else if (phoneDigits.startsWith('47') && phoneDigits.length === 10) {
                                    phoneDigits = phoneDigits.substring(2)
                                  }
                                  const isMobileNumber = /^[49]\d{7}$/.test(phoneDigits)
                                  return !isMobileNumber && (
                                    <span className="text-orange-600"> (ikke et mobilnummer - SMS sendes ikke)</span>
                                  )
                                })()}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          )}

          {/* Step 3: Confirmation (Admin) eller Date & Time (Normal) */}
          {currentStep === 3 && (
            <>
              {isAdminBooking ? (
                // For admin: Bekreftelse (oppsummering)
                <BookingSummary
                  bookingData={bookingData}
                  services={services as any}
                  vehicleTypes={vehicleTypes}
                  onNotesChange={(customerNotes) => 
                    setBookingData(prev => ({ ...prev, customerNotes }))
                  }
                  selectedCompany={customerType === 'company' ? selectedCompany : undefined}
                />
              ) : (
                // For private kunder: Dato & Tid
                <>
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
                    isAdminBooking={false}
                    adminOverride={false}
                    businessHoursStart={businessHoursStart}
                    businessHoursEnd={businessHoursEnd}
                  />
                </>
              )}
            </>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <BookingSummary
              bookingData={bookingData}
              services={services as any}
              vehicleTypes={vehicleTypes}
              onNotesChange={(customerNotes) => 
                setBookingData(prev => ({ ...prev, customerNotes }))
              }
              selectedCompany={customerType === 'company' ? selectedCompany : undefined}
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
          disabled={currentStep === (isAdminBooking ? 0 : 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Forrige
        </Button>

        <div className="flex space-x-2">
          {((isAdminBooking && currentStep < 3) || (!isAdminBooking && currentStep < 4)) ? (
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
              disabled={loading || !canProceedToStep(isAdminBooking ? 4 : 5)}
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