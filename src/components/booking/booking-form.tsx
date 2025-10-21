'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { CalendarIcon, Clock, Car, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface Service {
  id: string
  name: string
  description: string
  duration: number
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

interface User {
  id: string
  name: string
  email: string
}

interface BookingFormProps {
  services: Service[]
  vehicleTypes: VehicleType[]
  user: User
}

export function BookingForm({ services, vehicleTypes, user }: BookingFormProps) {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate price based on selected service and vehicle type
  const currentPrice = selectedService && selectedVehicleType 
    ? selectedService.servicePrices.find(sp => sp.vehicleTypeId === selectedVehicleType.id)?.price || 0
    : 0

  // Fetch available times when date changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableTimes()
    }
  }, [selectedDate, selectedService])

  const fetchAvailableTimes = async () => {
    if (!selectedDate || !selectedService) return

    try {
      const response = await fetch(`/api/availability?date=${selectedDate.toISOString().split('T')[0]}&duration=${selectedService.duration}`)
      const data = await response.json()
      setAvailableTimes(data.availableTimes || [])
    } catch (error) {
      console.error('Error fetching available times:', error)
      setAvailableTimes([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!selectedService || !selectedVehicleType || !selectedDate || !selectedTime) {
      setError('Vennligst fyll ut alle påkrevde felter')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          vehicleTypeId: selectedVehicleType.id,
          scheduledDate: selectedDate.toISOString().split('T')[0],
          scheduledTime: selectedTime,
          vehicleInfo,
          customerNotes,
          totalPrice: currentPrice,
        }),
      })

      if (response.ok) {
        const booking = await response.json()
        router.push(`/dashboard/bestillinger/${booking.id}?success=true`)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Selection */}
      <div className="space-y-3">
        <Label htmlFor="service">Velg tjeneste *</Label>
        <div className="grid gap-3">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={cn(
                "cursor-pointer transition-colors",
                selectedService?.id === service.id 
                  ? "border-blue-500 bg-blue-50" 
                  : "hover:border-gray-300"
              )}
              onClick={() => setSelectedService(service)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge variant="secondary">{service.duration} min</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
                {selectedVehicleType && (
                  <div className="mt-2">
                    <span className="font-semibold text-blue-600">
                      Fra kr {service.servicePrices.find(sp => sp.vehicleTypeId === selectedVehicleType.id)?.price || 'N/A'},-
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Vehicle Type Selection */}
      <div className="space-y-3">
        <Label htmlFor="vehicleType">Velg kjøretøy type *</Label>
        <Select onValueChange={(value) => {
          const vehicleType = vehicleTypes.find(vt => vt.id === value)
          setSelectedVehicleType(vehicleType || null)
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Velg type kjøretøy" />
          </SelectTrigger>
          <SelectContent>
            {vehicleTypes.map((vehicleType) => (
              <SelectItem key={vehicleType.id} value={vehicleType.id}>
                <div>
                  <div className="font-medium">{vehicleType.name}</div>
                  {vehicleType.description && (
                    <div className="text-sm text-gray-500">{vehicleType.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label>Velg dato *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP", { locale: nb }) : "Velg en dato"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selection */}
      {selectedDate && availableTimes.length > 0 && (
        <div className="space-y-3">
          <Label>Velg tid *</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {availableTimes.map((time) => (
              <Button
                key={time}
                type="button"
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTime(time)}
              >
                <Clock className="mr-1 h-3 w-3" />
                {time}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && availableTimes.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ingen ledige tider tilgjengelig for valgt dato. Prøv en annen dato.
          </AlertDescription>
        </Alert>
      )}

      {/* Vehicle Info */}
      <div className="space-y-3">
        <Label htmlFor="vehicleInfo">Bil informasjon (valgfritt)</Label>
        <Input
          id="vehicleInfo"
          value={vehicleInfo}
          onChange={(e) => setVehicleInfo(e.target.value)}
          placeholder="F.eks. BMW X5, regnr: AB12345"
        />
      </div>

      {/* Customer Notes */}
      <div className="space-y-3">
        <Label htmlFor="customerNotes">Spesielle ønsker (valgfritt)</Label>
        <Textarea
          id="customerNotes"
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder="Har du noen spesielle ønsker eller merknader til bestillingen?"
          rows={3}
        />
      </div>

      {/* Price Summary */}
      {currentPrice > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Bestillingssammendrag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Tjeneste:</span>
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Kjøretøy:</span>
              <span className="font-medium">{selectedVehicleType?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Varighet:</span>
              <span className="font-medium">{selectedService?.duration} minutter</span>
            </div>
            {selectedDate && selectedTime && (
              <div className="flex justify-between">
                <span>Dato & Tid:</span>
                <span className="font-medium">
                  {format(selectedDate, "d. MMMM yyyy", { locale: nb })} kl. {selectedTime}
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Total pris:</span>
              <span className="text-blue-600">kr {currentPrice.toLocaleString()},-</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={loading || !selectedService || !selectedVehicleType || !selectedDate || !selectedTime}
      >
        {loading ? 'Bestiller...' : `Bekreft bestilling - kr ${currentPrice.toLocaleString()},-`}
      </Button>
    </form>
  )
}