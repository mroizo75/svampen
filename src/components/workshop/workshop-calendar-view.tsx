'use client'

import { Calendar, momentLocalizer, Event } from 'react-big-calendar'
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
    vehicleInfo: string[]
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
  const [view, setView] = useState<'work_week' | 'day'>('work_week')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // SSE for sanntidsoppdateringer
  useEffect(() => {
    console.log('🔌 Kobler til SSE for booking-oppdateringer...')
    
    const eventSource = new EventSource('/api/bookings/stream')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'booking_update') {
          console.log('✨ Booking-oppdatering mottatt, oppdaterer kalender...')
          router.refresh()
        }
      } catch (error) {
        // Ignorer heartbeat meldinger
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error)
      eventSource.close()
    }
    
    return () => {
      console.log('🔌 Kobler fra SSE')
      eventSource.close()
    }
  }, [router])

  // Parse åpningstider - fast 07:00-15:00 for verksted
  const calendarMinTime = new Date(2025, 0, 1, 7, 0)
  const calendarMaxTime = new Date(2025, 0, 1, 16, 0)  // Viser til 15:00 (må sette til 16 for å inkludere 15:00-timen)

  // Konverter bookinger til kalender-events
  const events: CalendarEvent[] = bookings.map(booking => {
    // scheduledTime inneholder allerede både dato og tid fra databasen
    // MySQL lagrer som UTC, så vi må lese UTC-verdiene og behandle dem som lokal tid
    const scheduledTime = new Date(booking.scheduledTime)
    
    // Hent UTC-verdier og bruk dem som lokale verdier (fordi de ble lagret som lokal tid)
    const startTime = new Date(
      scheduledTime.getUTCFullYear(),
      scheduledTime.getUTCMonth(),
      scheduledTime.getUTCDate(),
      scheduledTime.getUTCHours(),
      scheduledTime.getUTCMinutes()
    )
    
    const endTime = new Date(startTime.getTime() + booking.totalDuration * 60000)

    const vehicleInfo: string[] = booking.bookingVehicles
      .map(v => v.vehicleInfo)
      .filter((info): info is string => !!info)
      .map(info => {
        const match = info.match(/(?:Regnr|Reg\.nr|VIN):\s*([A-Za-z0-9]+)/i)
        return match ? match[1] : info
      })

    const customerName = booking.company 
      ? booking.company.name
      : `${booking.user.firstName} ${booking.user.lastName}`

    return {
      title: `${customerName} - ${vehicleInfo[0] || booking.bookingVehicles.length + ' kjøretøy'}`,
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
        onView={(newView) => setView(newView as 'work_week' | 'day')}
        views={['work_week', 'day']}
        defaultView="work_week"
        min={calendarMinTime}
        max={calendarMaxTime}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent as any,
        }}
        onSelectEvent={handleSelectEvent}
        selectable={false}
        step={30}
        timeslots={2}
        popup
        dayLayoutAlgorithm="no-overlap"
        messages={{
          next: 'Neste',
          previous: 'Forrige',
          today: 'I dag',
          work_week: 'Arbeidsuke',
          day: 'Dag',
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
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Booking Detaljer
                </DialogTitle>
                <DialogDescription>
                  Booking ID: {selectedEvent.resource.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status Badge */}
                <div>
                  <Badge 
                    variant={
                      selectedEvent.resource.status === 'CONFIRMED' ? 'default' :
                      selectedEvent.resource.status === 'IN_PROGRESS' ? 'secondary' :
                      selectedEvent.resource.status === 'COMPLETED' ? 'default' :
                      'destructive'
                    }
                    className="text-sm"
                  >
                    {selectedEvent.resource.status === 'CONFIRMED' && '✓ Bekreftet'}
                    {selectedEvent.resource.status === 'IN_PROGRESS' && '⚙️ Pågår'}
                    {selectedEvent.resource.status === 'COMPLETED' && '✓ Fullført'}
                    {selectedEvent.resource.status === 'NO_SHOW' && '✗ Møtte ikke opp'}
                  </Badge>
                </div>

                {/* Kunde Info */}
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {selectedEvent.resource.companyName ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    Kundeinformasjon
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Navn:</strong> {selectedEvent.resource.customerName}</p>
                    {selectedEvent.resource.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedEvent.resource.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedEvent.resource.email}
                    </p>
                  </div>
                </div>

                {/* Kjøretøy */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Kjøretøy ({selectedEvent.resource.vehicleCount})
                  </h3>
                  {selectedEvent.resource.fullBooking.bookingVehicles.map((vehicle, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded space-y-2">
                      <p className="font-medium">{vehicle.vehicleType.name}</p>
                      {vehicle.vehicleInfo && (
                        <p className="text-sm text-gray-600">{vehicle.vehicleInfo}</p>
                      )}
                      {vehicle.vehicleNotes && (
                        <p className="text-sm text-gray-500 italic">{vehicle.vehicleNotes}</p>
                      )}
                      
                      {/* Tjenester */}
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-700 uppercase">Tjenester:</p>
                        {vehicle.bookingServices.map((bs, bsIdx) => (
                          <div key={bsIdx} className="flex justify-between text-sm">
                            <span>{bs.service.name}</span>
                            <span className="font-medium">kr {Number(bs.totalPrice).toLocaleString('nb-NO')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tid og Pris */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Varighet
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.floor(selectedEvent.resource.duration / 60)}t {selectedEvent.resource.duration % 60}m
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Pris</p>
                    <p className="text-2xl font-bold text-green-600">
                      kr {Number(selectedEvent.resource.totalPrice).toLocaleString('nb-NO')}
                    </p>
                  </div>
                </div>

                {/* Kundenotat */}
                {selectedEvent.resource.fullBooking.customerNotes && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Kundens beskjed:</p>
                    <p className="text-sm italic">{selectedEvent.resource.fullBooking.customerNotes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
