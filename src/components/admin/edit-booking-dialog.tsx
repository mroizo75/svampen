'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Edit, Calendar as CalendarIcon, Clock, Loader2, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface BookingVehicleSummary {
  id: string
  vehicleTypeId: string
  vehicleTypeName: string
  vehicleInfo?: string | null
  services: Array<{
    id: string
    serviceId: string
    name: string
    quantity: number
    unitPrice: number
  }>
}

interface ServiceOption {
  id: string
  name: string
  description: string
  duration: number
  category: 'MAIN' | 'ADDON' | 'SPECIAL' | 'DEALER'
  servicePrices: Array<{
    vehicleTypeId: string
    price: number
  }>
  isAdminOnly?: boolean
}

type PendingService = {
  bookingVehicleId: string
  serviceId: string
  quantity: number
  serviceName: string
}

interface EditBookingDialogProps {
  bookingId: string
  currentDate: Date
  currentTime: Date
  currentStatus: BookingStatus
  currentNotes?: string
  duration: number
  bookingVehicles: BookingVehicleSummary[]
}

export function EditBookingDialog({ 
  bookingId, 
  currentDate, 
  currentTime, 
  currentStatus,
  currentNotes,
  duration,
  bookingVehicles,
}: EditBookingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    // Sørg for at vi bruker lokal tid
    const time = new Date(currentTime)
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })
  const [status, setStatus] = useState<BookingStatus>(currentStatus)
  const [notes, setNotes] = useState(currentNotes || '')
  const [sendNotification, setSendNotification] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [pendingServices, setPendingServices] = useState<PendingService[]>([])
  const [serviceSelections, setServiceSelections] = useState<Record<string, { serviceId?: string; quantity: number }>>({})
  const [serviceError, setServiceError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || availableServices.length > 0) {
      return
    }

    let isMounted = true

    const fetchServices = async () => {
      setServicesLoading(true)
      setServicesError(null)

      try {
        const response = await fetch('/api/services')
        if (!response.ok) {
          throw new Error('Kunne ikke hente tjenester')
        }
        const data = await response.json()
        if (isMounted) {
          setAvailableServices(data)
        }
      } catch {
        if (isMounted) {
          setServicesError('Kunne ikke hente tjenester')
        }
      } finally {
        if (isMounted) {
          setServicesLoading(false)
        }
      }
    }

    fetchServices()

    return () => {
      isMounted = false
    }
  }, [open, availableServices.length])

  useEffect(() => {
    if (!open) {
      setPendingServices([])
      setServiceSelections({})
      setServiceError(null)
    }
  }, [open])

  const getServicesForVehicle = (vehicleTypeId: string) => {
    return availableServices.filter((service) =>
      service.servicePrices.some((price) => price.vehicleTypeId === vehicleTypeId && Number(price.price) > 0)
    )
  }

  const getServiceDisplayPrice = (service: ServiceOption, vehicleTypeId: string) => {
    const price = service.servicePrices.find((sp) => sp.vehicleTypeId === vehicleTypeId)
    return typeof price?.price === 'number' ? price.price : null
  }

  const handleServiceSelectionChange = (vehicleId: string, serviceId?: string) => {
    setServiceSelections((prev) => ({
      ...prev,
      [vehicleId]: {
        serviceId,
        quantity: prev[vehicleId]?.quantity ?? 1,
      },
    }))
  }

  const handleQuantityChange = (vehicleId: string, quantityValue: string) => {
    const parsed = Number(quantityValue)
    const sanitized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
    setServiceSelections((prev) => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        quantity: sanitized,
      },
    }))
  }

  const handleAddServiceForVehicle = (vehicleId: string) => {
    const selection = serviceSelections[vehicleId]
    if (!selection?.serviceId) {
      setServiceError('Velg en tjeneste før du legger til.')
      return
    }

    const serviceId = selection.serviceId
    const quantity = selection.quantity && selection.quantity > 0 ? selection.quantity : 1
    const service = availableServices.find((item) => item.id === serviceId)
    if (!service) {
      setServiceError('Fant ikke valgt tjeneste.')
      return
    }

    setServiceError(null)
    setPendingServices((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.bookingVehicleId === vehicleId && item.serviceId === serviceId
      )

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      return [
        ...prev,
        {
          bookingVehicleId: vehicleId,
          serviceId,
          quantity,
          serviceName: service.name,
        },
      ]
    })

    setServiceSelections((prev) => ({
      ...prev,
      [vehicleId]: {
        serviceId: undefined,
        quantity: 1,
      },
    }))
  }

  const handleRemovePendingService = (vehicleId: string, serviceId: string) => {
    setPendingServices((prev) =>
      prev.filter((item) => item.bookingVehicleId !== vehicleId || item.serviceId !== serviceId)
    )
  }

  const getPendingServicesForVehicle = (vehicleId: string) =>
    pendingServices.filter((service) => service.bookingVehicleId === vehicleId)

  // Hent tilgjengelige tider når dato endres
  const fetchAvailableTimes = async (date: Date) => {
    setCheckingAvailability(true)
    setAvailabilityError(null)
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/availability?date=${formattedDate}&duration=${duration}`)
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente tilgjengelige tider')
      }
      
      const data = await response.json()
      
      if (data.isClosed) {
        setAvailabilityError(data.message || 'Denne dagen er stengt')
        setAvailableTimes([])
      } else {
        setAvailableTimes(data.availableTimes || [])
        if (data.availableTimes.length === 0) {
          setAvailabilityError('Ingen ledige tider denne dagen')
        }
      }
    } catch (err) {
      setAvailabilityError('Kunne ikke sjekke tilgjengelighet')
      setAvailableTimes([])
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      fetchAvailableTimes(date)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const servicesPayload = pendingServices.length > 0
        ? pendingServices.map((service) => ({
            bookingVehicleId: service.bookingVehicleId,
            serviceId: service.serviceId,
            quantity: service.quantity,
          }))
        : undefined

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
          scheduledTime: selectedTime,
          status,
          customerNotes: notes,
          sendNotification,
          addedServices: servicesPayload,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Kunne ikke oppdatere bestilling')
      }

      setOpen(false)
      setPendingServices([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Rediger bestilling
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger bestilling</DialogTitle>
          <DialogDescription>
            Endre dato, tid, status, merknader eller legg til ekstra tjenester.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dato */}
          <div className="space-y-2">
            <Label>Dato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPPP', { locale: nb })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  locale={nb}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {availabilityError && (
              <p className="text-sm text-red-600">{availabilityError}</p>
            )}
          </div>

          {/* Tid */}
          <div className="space-y-2">
            <Label>Tidspunkt</Label>
            {checkingAvailability ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Sjekker tilgjengelighet...</span>
              </div>
            ) : availableTimes.length > 0 ? (
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg tid" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full"
              />
            )}
            <p className="text-xs text-gray-500">
              Varighet: {Math.floor(duration / 60)}t {duration % 60}min
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as BookingStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Venter</SelectItem>
                <SelectItem value="CONFIRMED">Bekreftet</SelectItem>
                <SelectItem value="IN_PROGRESS">Pågår</SelectItem>
                <SelectItem value="COMPLETED">Fullført</SelectItem>
                <SelectItem value="CANCELLED">Kansellert</SelectItem>
                <SelectItem value="NO_SHOW">Ikke møtt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Merknader */}
          <div className="space-y-2">
            <Label>Merknader</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Legge til merknader..."
              rows={3}
            />
          </div>

          {/* Tjenester */}
          {bookingVehicles.length > 0 && (
            <div className="space-y-3">
              <Label>Legg til tjenester</Label>
              <p className="text-sm text-gray-600">
                Legg til ekstra tjenester for hvert kjøretøy. Endringene lagres når du trykker «Lagre endringer».
              </p>
              {servicesError && (
                <p className="text-sm text-red-600">{servicesError}</p>
              )}
              <div className="space-y-3">
                {bookingVehicles.map((vehicle) => {
                  const vehicleServices = getServicesForVehicle(vehicle.vehicleTypeId)
                  const pendingForVehicle = getPendingServicesForVehicle(vehicle.id)
                  const selection = serviceSelections[vehicle.id]

                  return (
                    <div key={vehicle.id} className="space-y-3 rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.vehicleTypeName}
                          {vehicle.vehicleInfo && (
                            <span className="ml-2 text-sm text-gray-500">{vehicle.vehicleInfo}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {vehicle.services.length > 0 ? 'Eksisterende tjenester' : 'Ingen tjenester registrert'}
                        </p>
                        {vehicle.services.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {vehicle.services.map((service) => (
                              <Badge key={service.id} variant="secondary">
                                {service.name}
                                {service.quantity > 1 && ` × ${service.quantity}`}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Legg til ekstra tjeneste</Label>
                        {servicesLoading ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Laster tjenester...
                          </div>
                        ) : vehicleServices.length > 0 ? (
                          <div className="flex flex-col gap-2 md:flex-row">
                            <Select
                              value={selection?.serviceId}
                              onValueChange={(value) => handleServiceSelectionChange(vehicle.id, value)}
                            >
                              <SelectTrigger className="md:flex-1">
                                <SelectValue placeholder="Velg tjeneste" />
                              </SelectTrigger>
                              <SelectContent>
                                {vehicleServices.map((service) => {
                                  const price = getServiceDisplayPrice(service, vehicle.vehicleTypeId)
                                  return (
                                    <SelectItem key={service.id} value={service.id}>
                                      {service.name}
                                      {price !== null && ` — kr ${price.toLocaleString('nb-NO')}`}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              className="md:w-24"
                              value={selection?.quantity ?? 1}
                              onChange={(e) => handleQuantityChange(vehicle.id, e.target.value)}
                            />
                            <Button
                              type="button"
                              onClick={() => handleAddServiceForVehicle(vehicle.id)}
                              disabled={!selection?.serviceId}
                              className="md:w-auto"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Legg til
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Ingen aktive tjenester tilgjengelig for denne kjøretøytypen.
                          </p>
                        )}
                      </div>

                      {pendingForVehicle.length > 0 && (
                        <div className="rounded-md border border-dashed border-blue-200 bg-blue-50 p-3">
                          <p className="text-sm font-medium text-blue-900">Legges til når du lagrer</p>
                          <div className="mt-2 space-y-1">
                            {pendingForVehicle.map((service) => (
                              <div
                                key={service.serviceId}
                                className="flex items-center justify-between text-sm text-blue-900"
                              >
                                <span>
                                  {service.serviceName} × {service.quantity}
                                </span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemovePendingService(vehicle.id, service.serviceId)}
                                  className="text-blue-700 hover:text-blue-900"
                                  aria-label="Fjern tjeneste"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {serviceError && <p className="text-sm text-red-600">{serviceError}</p>}
            </div>
          )}

          {/* Varsling */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendNotification"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
            />
            <Label
              htmlFor="sendNotification"
              className="text-sm font-normal cursor-pointer"
            >
              Send varsel til kunde om endringene (e-post)
            </Label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={loading || checkingAvailability}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              'Lagre endringer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

