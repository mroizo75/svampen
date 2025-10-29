'use client'

import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/nb'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Car, Clock, User, Building2, Phone, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

moment.locale('nb')
const localizer = momentLocalizer(moment)

interface BookingVehicle {
  vehicleType: {
    name: string
  }
  vehicleInfo: string | null
  vehicleNotes: string | null
  bookingServices: Array<{
    service: {
      name: string
    }
    unitPrice: number
    totalPrice: number
  }>
}

interface Booking {
  id: string
  status: string
  scheduledDate: Date
  scheduledTime: Date
  totalDuration: number
  totalPrice: number
  customerNotes: string | null
  user: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  company?: {
    name: string
    orgNumber: string | null
  } | null
  bookingVehicles: BookingVehicle[]
}

interface CalendarEvent extends Event {
  resource: {
    id: string
    status: string
    customerName: string
    companyName?: string
    vehicleInfo: string[]  // Array med kjøretøyinfo (regnr/VIN)
    vehicleCount: number
    totalPrice: number
    duration: number
    phone?: string | null
    email: string
    fullBooking: Booking
  }
}

interface WorkshopCalendarViewProps {
  bookings: Booking[]
  businessHoursStart?: string
  businessHoursEnd?: string
}

export default function WorkshopCalendarView({ 
  bookings, 
  businessHoursStart = '08:00',
  businessHoursEnd = '16:00' 
}: WorkshopCalendarViewProps) {
  const router = useRouter()
  const [view, setView] = useState<View>('week')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Auto-refresh hver 5. minutt
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5 * 60 * 1000) // 5 minutter

    return () => clearInterval(interval)
  }, [router])

  // Parse åpningstider
  const [startHour, startMinute] = businessHoursStart.split(':').map(Number)
  const [endHour, endMinute] = businessHoursEnd.split(':').map(Number)
  
  // Kalender min/max tider
  const calendarMinTime = new Date(2025, 0, 1, Math.max(0, startHour - 1), 0)
  const calendarMaxTime = new Date(2025, 0, 1, Math.min(23, endHour + 1), 0)

  // Konverter bookinger til kalender-events
  const events: CalendarEvent[] = bookings.map(booking => {
    const scheduledDate = new Date(booking.scheduledDate)
    const scheduledTime = new Date(booking.scheduledTime)
    
    const startTime = new Date(
      scheduledDate.getFullYear(),
      scheduledDate.getMonth(),
      scheduledDate.getDate(),
      scheduledTime.getHours(),
      scheduledTime.getMinutes()
    )
    
    const endTime = new Date(startTime.getTime() + booking.totalDuration * 60000)

    // Samle kjøretøyinfo (regnr/VIN) fra vehicleInfo feltet
    const vehicleInfo: string[] = booking.bookingVehicles
      .map(v => v.vehicleInfo)
      .filter((info): info is string => !!info)
      .map(info => {
        // Parse vehicleInfo som kan være i format "Regnr: ABC123" eller "VIN: XYZ"
        const match = info.match(/(?:Regnr|Reg\.nr|VIN):\s*([A-Za-z0-9]+)/i)
        return match ? match[1] : info
      })

    const customerName = booking.company 
      ? booking.company.name 
      : `${booking.user.firstName} ${booking.user.lastName}`

    return {
      id: booking.id,
      title: booking.company 
        ? `${booking.company.name} ${vehicleInfo.length > 0 ? `- ${vehicleInfo.join(', ')}` : ''}`
        : `${booking.user.firstName} ${booking.user.lastName}`,
      start: startTime,
      end: endTime,
      resource: {
        id: booking.id,
        status: booking.status,
        customerName,
        companyName: booking.company?.name,
        vehicleInfo,
        vehicleCount: booking.bookingVehicles.length,
        totalPrice: booking.totalPrice,
        duration: booking.totalDuration,
        phone: booking.user.phone,
        email: booking.user.email,
        fullBooking: booking,
      },
    }
  })

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDetailsOpen(true)
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6' // blue-600 for CONFIRMED
    
    if (event.resource.status === 'IN_PROGRESS') {
      backgroundColor = '#8b5cf6' // purple-600
    } else if (event.resource.status === 'COMPLETED') {
      backgroundColor = '#10b981' // green-600
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.95,
        color: 'white',
        border: '2px solid white',
        display: 'flex',
        flexDirection: 'column' as const,
        fontSize: '13px',
        padding: '6px 8px',
        fontWeight: '500',
        lineHeight: '1.3',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        cursor: 'pointer',
      },
    }
  }

  // Custom event-wrapper for bedre visning av overlappende events
  const EventComponent = ({ event }: { event: any }) => {
    const hours = Math.floor(event.resource.duration / 60)
    const minutes = event.resource.duration % 60
    const timeStr = hours > 0 ? `${hours}t${minutes > 0 ? ` ${minutes}m` : ''}` : `${minutes}m`
    
    return (
      <div className="flex flex-col h-full justify-between" style={{ minHeight: '50px' }}>
        <div>
          <div className="font-bold truncate text-white" style={{ fontSize: '13px' }}>
            {event.resource.customerName}
          </div>
          {event.resource.vehicleInfo.length > 0 && (
            <div className="text-yellow-300 font-bold text-xs truncate">
              {event.resource.vehicleInfo[0]}
            </div>
          )}
        </div>
        <div className="text-white/80 text-xs font-medium">
          {timeStr} • {event.resource.vehicleCount} kjøretøy
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-240px)]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        views={['month', 'week', 'day']}
        defaultView="week"
        min={calendarMinTime}
        max={calendarMaxTime}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent as any,
        }}
        onSelectEvent={handleSelectEvent}
        selectable={false}  // Verksted kan ikke lage nye bookinger
        step={30}
        timeslots={2}
        popup
        dayLayoutAlgorithm="no-overlap"
        messages={{
          next: 'Neste',
          previous: 'Forrige',
          today: 'I dag',
          month: 'Måned',
          week: 'Uke',
          day: 'Dag',
          agenda: 'Agenda',
          date: 'Dato',
          time: 'Tid',
          event: 'Booking',
          noEventsInRange: 'Ingen bookinger i denne perioden',
          showMore: (total: number) => `+ ${total} flere`,
        }}
      />

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Booking Detaljer
            </DialogTitle>
            <DialogDescription>
              Fullstendig informasjon om bestillingen
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={
                    selectedEvent.resource.status === 'CONFIRMED' ? 'default' : 
                    selectedEvent.resource.status === 'IN_PROGRESS' ? 'secondary' : 
                    'default'
                  }
                  className="text-sm"
                >
                  {selectedEvent.resource.status === 'CONFIRMED' && '✓ Bekreftet'}
                  {selectedEvent.resource.status === 'IN_PROGRESS' && '⚙️ I gang'}
                  {selectedEvent.resource.status === 'COMPLETED' && '✅ Fullført'}
                </Badge>
              </div>

              {/* Kunde/Bedrift Info */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {selectedEvent.resource.companyName ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Bedrift</p>
                        <p className="font-semibold text-lg">{selectedEvent.resource.companyName}</p>
                      </div>
                    </div>
                    {selectedEvent.resource.fullBooking.company?.orgNumber && (
                      <p className="text-sm text-gray-600 ml-7">
                        Org.nr: {selectedEvent.resource.fullBooking.company.orgNumber}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Privatkunde</p>
                      <p className="font-semibold text-lg">{selectedEvent.resource.customerName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 ml-7">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <p className="text-sm">{selectedEvent.resource.email}</p>
                </div>

                {selectedEvent.resource.phone && (
                  <div className="flex items-center space-x-2 ml-7">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <p className="text-sm">{selectedEvent.resource.phone}</p>
                  </div>
                )}
              </div>

              {/* Tid Info */}
              <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold">Tidspunkt</p>
                </div>
                <p className="ml-7 text-lg">
                  {selectedEvent.start?.toLocaleDateString('nb-NO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="ml-7 text-xl font-bold text-blue-600">
                  {selectedEvent.start?.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} - {' '}
                  {selectedEvent.end?.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="ml-7 text-sm text-gray-600">
                  Varighet: {Math.floor(selectedEvent.resource.duration / 60)}t {selectedEvent.resource.duration % 60}min
                </p>
              </div>

              {/* Kjøretøy Info - VIKTIG FOR VERKSTED */}
              <div className="space-y-3 bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-lg">Kjøretøy ({selectedEvent.resource.vehicleCount})</p>
                </div>
                
                {selectedEvent.resource.fullBooking.bookingVehicles.map((vehicle, idx) => (
                  <div key={idx} className="ml-7 space-y-2 pb-3 border-b last:border-b-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-base">{vehicle.vehicleType.name}</p>
                    </div>
                    
                    {/* VIS REGNR/VIN PROMINENTLY */}
                    {vehicle.vehicleInfo && (
                      <div className="bg-yellow-100 border-2 border-yellow-400 p-3 rounded-md">
                        <p className="text-xs text-yellow-800 font-semibold uppercase">Kjøretøyinfo</p>
                        <p className="text-lg font-bold text-yellow-900">{vehicle.vehicleInfo}</p>
                      </div>
                    )}

                    {vehicle.vehicleNotes && (
                      <p className="text-sm text-gray-600 italic">
                        Notater: {vehicle.vehicleNotes}
                      </p>
                    )}

                    {/* Tjenester */}
                    <div className="space-y-1 mt-2">
                      <p className="text-sm font-medium text-gray-700">Tjenester:</p>
                      {vehicle.bookingServices.map((service, serviceIdx) => (
                        <div key={serviceIdx} className="text-sm text-gray-600 ml-3">
                          • {service.service.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Kundens Notater */}
              {selectedEvent.resource.fullBooking.customerNotes && (
                <div className="space-y-2 bg-orange-50 p-4 rounded-lg">
                  <p className="font-semibold">Kundens notater:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedEvent.resource.fullBooking.customerNotes}
                  </p>
                </div>
              )}

              {/* Total Pris */}
              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <p className="text-sm">Total pris</p>
                <p className="text-3xl font-bold">
                  kr {selectedEvent.resource.totalPrice.toLocaleString('nb-NO')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

