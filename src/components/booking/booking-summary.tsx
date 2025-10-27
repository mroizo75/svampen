'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Car, 
  Clock, 
  Calendar,
  DollarSign,
  CheckCircle,
  Info,
  User,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  category: 'MAIN' | 'ADDON' | 'SPECIAL'
}

interface VehicleType {
  id: string
  name: string
  description: string
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
  vehicles: Array<{
    id: string
    vehicleTypeId: string
    vehicleInfo: string
    vehicleNotes: string
    services: Array<{
      serviceId: string
      quantity: number
      unitPrice: number
      totalPrice: number
      duration: number
    }>
  }>
  customerInfo: CustomerInfo
  scheduledDate?: Date
  scheduledTime?: string
  customerNotes: string
  totalPrice: number
  totalDuration: number
  companyId?: string
}

interface BookingSummaryProps {
  bookingData: BookingData
  services: Service[]
  vehicleTypes: VehicleType[]
  onNotesChange: (notes: string) => void
  selectedCompany?: any // Bedriftsinfo hvis bedriftskunde
}

export function BookingSummary({
  bookingData,
  services,
  vehicleTypes,
  onNotesChange,
  selectedCompany,
}: BookingSummaryProps) {
  const getService = (serviceId: string) => {
    return services.find(s => s.id === serviceId)
  }

  const getVehicleType = (vehicleTypeId: string) => {
    return vehicleTypes.find(vt => vt.id === vehicleTypeId)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}t ${mins}min`
    } else if (hours > 0) {
      return `${hours}t`
    } else {
      return `${mins}min`
    }
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'MAIN':
        return <Badge className="bg-blue-100 text-blue-800">Hovedpakke</Badge>
      case 'ADDON':
        return <Badge className="bg-green-100 text-green-800">Tillegg</Badge>
      case 'SPECIAL':
        return <Badge className="bg-purple-100 text-purple-800">Spesial</Badge>
      default:
        return <Badge variant="secondary">{category}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Booking Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <CheckCircle className="mr-2 h-5 w-5" />
            Bestillingssammendrag
          </CardTitle>
          <CardDescription className="text-blue-700">
            Gjennomgå din bestilling før du sender den inn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingData.scheduledDate && bookingData.scheduledTime && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {format(bookingData.scheduledDate, "EEEE d. MMMM yyyy", { locale: nb })}
                  </div>
                  <div className="text-sm text-gray-600">Dato</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {bookingData.scheduledTime} - {calculateEndTime(bookingData.scheduledTime, bookingData.totalDuration)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDuration(bookingData.totalDuration)} total tid
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            {selectedCompany ? (
              <><Building2 className="mr-2 h-5 w-5" /> Bedriftskunde</>
            ) : (
              <><User className="mr-2 h-5 w-5" /> Kunde informasjon</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCompany ? (
            // Bedriftskunde
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-blue-600">Bedrift:</span>
                <p className="font-medium">{selectedCompany.name}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600">Org.nr:</span>
                <p className="font-medium">{selectedCompany.orgNumber}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600">E-post:</span>
                <p className="font-medium">{selectedCompany.contactEmail || bookingData.customerInfo.email}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600">Telefon:</span>
                <p className="font-medium">{selectedCompany.contactPhone || bookingData.customerInfo.phone}</p>
              </div>
              {selectedCompany.discountPercent > 0 && (
                <div>
                  <span className="text-sm text-blue-600">Rabatt:</span>
                  <p className="font-medium text-green-600">{selectedCompany.discountPercent}% (Fast avtale)</p>
                </div>
              )}
              {selectedCompany.contactPerson && (
                <div>
                  <span className="text-sm text-blue-600">Kontaktperson:</span>
                  <p className="font-medium">
                    {selectedCompany.contactPerson.firstName} {selectedCompany.contactPerson.lastName}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Privatkunde
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-blue-600">Navn:</span>
                <p className="font-medium">{bookingData.customerInfo.firstName} {bookingData.customerInfo.lastName}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600">E-post:</span>
                <p className="font-medium">{bookingData.customerInfo.email}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600">Telefon:</span>
                <p className="font-medium">{bookingData.customerInfo.phone}</p>
              </div>
              {bookingData.customerInfo.createAccount && (
                <div>
                  <span className="text-sm text-blue-600">Kontotype:</span>
                  <p className="font-medium">Ny konto opprettes</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicles and Services */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Kjøretøy og tjenester</h3>
        
        {bookingData.vehicles.map((vehicle, vehicleIndex) => {
          const vehicleType = getVehicleType(vehicle.vehicleTypeId)
          const vehicleTotalPrice = vehicle.services.reduce((sum, s) => sum + Number(s.totalPrice), 0)
          const vehicleTotalDuration = vehicle.services.reduce((sum, s) => sum + (Number(s.duration) * Number(s.quantity)), 0)

          return (
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="mr-2 h-5 w-5" />
                  Kjøretøy {vehicleIndex + 1}: {vehicleType?.name}
                </CardTitle>
                {vehicle.vehicleInfo && (
                  <CardDescription>{vehicle.vehicleInfo}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicle.services.map((serviceBooking, serviceIndex) => {
                    const service = getService(serviceBooking.serviceId)
                    
                    return (
                      <div key={`${serviceBooking.serviceId}-${serviceIndex}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{service?.name}</span>
                            {service && getCategoryBadge(service.category)}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center mt-1">
                            <Clock className="mr-1 h-3 w-3" />
                            {serviceBooking.duration} min
                            {serviceBooking.quantity > 1 && ` × ${serviceBooking.quantity}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            kr {Number(serviceBooking.totalPrice).toLocaleString()}
                          </div>
                          {serviceBooking.quantity > 1 && (
                            <div className="text-sm text-gray-500">
                              kr {Number(serviceBooking.unitPrice).toLocaleString()} × {serviceBooking.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {vehicle.vehicleNotes && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-800">Spesielle merknader:</div>
                          <div className="text-sm text-yellow-700">{vehicle.vehicleNotes}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="flex justify-between items-center font-medium">
                    <span>Subtotal for dette kjøretøyet:</span>
                    <div className="text-right">
                      <div>kr {Number(vehicleTotalPrice).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(vehicleTotalDuration)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Customer Notes */}
      <div className="space-y-3">
        <Label htmlFor="customerNotes">
          Ekstra kommentarer til bestillingen (valgfritt)
        </Label>
        <Textarea
          id="customerNotes"
          value={bookingData.customerNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Har du noen spesielle ønsker eller merknader til hele bestillingen?"
          rows={3}
        />
      </div>

      {/* Total Summary */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold text-green-800">
                  Total tid: {formatDuration(bookingData.totalDuration)}
                </span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                {bookingData.vehicles.length} kjøretøy
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-800">
                  kr {Number(bookingData.totalPrice).toLocaleString()},-
                </span>
              </div>
              <div className="text-sm text-green-600">
                Total pris
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800">Betaling:</div>
              <div className="text-sm text-yellow-700 space-y-1 mt-1">
                <p>• Betaling skjer ved oppmøte eller kan ordnes i forkant</p>
                <p>• Vi aksepterer kontant, kort og Vipps</p>
                <p>• Faktura kan sendes til bedriftskunder</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <div className="font-medium text-orange-800">Viktig informasjon:</div>
              <div className="text-sm text-orange-700 space-y-1 mt-1">
                <p>• Timer som ikke blir benyttet eller ikke møtt vil bli fakturert 50%</p>
                <p>• Vennligst gi beskjed i god tid dersom du må avbestille</p>
                <p>• Du vil motta en bekreftelse på e-post når bestillingen er godkjent</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}