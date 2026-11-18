'use client'

import { Calendar, momentLocalizer, Event, SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/nb'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import QuickBookingDialog from './quick-booking-dialog'
import { getNorwegianHolidays } from '@/lib/norwegian-holidays'
import { formatBookingCustomerName } from '@/lib/cash-customer'
import { osloWallClockDate } from '@/lib/booking-datetime'

moment.locale('nb')
const localizer = momentLocalizer(moment)

interface BookingVehicle {
  vehicleType: {
    name: string
  }
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
  user: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  bookingVehicles: BookingVehicle[]
}

interface CalendarEvent extends Event {
  resource: {
    id: string
    status: string
    customerName: string
    vehicleCount: number
    totalPrice: number
    duration: number
  }
}

interface CalendarViewProps {
  bookings: Booking[]
  businessHoursStart?: string
  businessHoursEnd?: string
}

interface ClosedDate {
  id: string
  date: Date
  reason: string
  type: 'HOLIDAY' | 'VACATION' | 'MANUAL' | 'OTHER'
}

export default function CalendarView({ 
  bookings, 
  businessHoursStart = '08:00',
  businessHoursEnd = '16:00' 
}: CalendarViewProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')
  const [quickBookingOpen, setQuickBookingOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time?: Date } | null>(null)
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([])

  // Hent stengte dager
  useEffect(() => {
    const fetchClosedDates = async () => {
      try {
        const response = await fetch('/api/admin/closed-dates')
        if (response.ok) {
          const data = await response.json()
          setClosedDates(data.map((d: ClosedDate) => ({
            ...d,
            date: new Date(d.date),
          })))
        }
      } catch (error) {
        console.error('Error fetching closed dates:', error)
      }
    }
    
    fetchClosedDates()
  }, [])

  // SSE for sanntidsoppdateringer
  useEffect(() => {
    console.log('🔌 Kobler til SSE for booking-oppdateringer...')
    
    const eventSource = new EventSource('/api/bookings/stream')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'booking_update') {
          console.log('✨ Booking-oppdatering mottatt, oppdaterer kalender...')
          window.location.reload()
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
  }, [])

  // Parse åpningstider
  const [startHour, startMinute] = businessHoursStart.split(':').map(Number)
  const [endHour, endMinute] = businessHoursEnd.split(':').map(Number)
  
  // Kalender min/max tider (utvid litt for bedre visning)
  const calendarMinTime = new Date(2025, 0, 1, Math.max(0, startHour - 1), 0)
  const calendarMaxTime = new Date(2025, 0, 1, Math.min(23, endHour + 1), 0)

  // Konverter bookinger til kalender-events
  const bookingEvents: CalendarEvent[] = bookings.map(booking => {
    const start = osloWallClockDate(new Date(booking.scheduledTime))
    
    // Legg til varighet for slutttid
    const end = new Date(start.getTime() + booking.totalDuration * 60000)
    
    const customerName = formatBookingCustomerName(booking.user.firstName, booking.user.lastName)
    const vehicleCount = booking.bookingVehicles.length
    
    return {
      title: `${customerName} - ${vehicleCount} kjøretøy`,
      start,
      end,
      resource: {
        id: booking.id,
        status: booking.status,
        customerName,
        vehicleCount,
        totalPrice: booking.totalPrice,
        duration: booking.totalDuration,
      },
    }
  })

  // Legg til stengte dager som hele-dags-events
  const closedDateEvents: CalendarEvent[] = closedDates.map(closedDate => {
    const date = new Date(closedDate.date)
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    
    return {
      title: `STENGT: ${closedDate.reason}`,
      start,
      end,
      allDay: true,
      resource: {
        id: `closed-${closedDate.id}`,
        status: 'CLOSED',
        customerName: '',
        vehicleCount: 0,
        totalPrice: 0,
        duration: 0,
      },
    }
  })

  // Legg til norske helligdager for inneværende og neste år
  const currentYear = new Date().getFullYear()
  const norwegianHolidays = [
    ...getNorwegianHolidays(currentYear),
    ...getNorwegianHolidays(currentYear + 1),
  ]

  const holidayEvents: CalendarEvent[] = norwegianHolidays.map(holiday => {
    const date = holiday.date
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    
    return {
      title: `🇳🇴 ${holiday.name}`,
      start,
      end,
      allDay: true,
      resource: {
        id: `holiday-${holiday.name}-${date.getFullYear()}`,
        status: 'CLOSED',
        customerName: '',
        vehicleCount: 0,
        totalPrice: 0,
        duration: 0,
      },
    }
  })

  const events = [...bookingEvents, ...closedDateEvents, ...holidayEvents]

  // Farger basert på status med forbedret visning
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6' // blue (default)
    let cursor = 'pointer'
    
    switch (event.resource.status) {
      case 'CLOSED':
        backgroundColor = '#ef4444' // red for stengte dager
        cursor = 'default'
        break
      case 'CONFIRMED':
        backgroundColor = '#3b82f6' // blue
        break
      case 'IN_PROGRESS':
        backgroundColor = '#8b5cf6' // purple
        break
      case 'COMPLETED':
        backgroundColor = '#22c55e' // green
        break
      case 'NO_SHOW':
        backgroundColor = '#dc2626' // dark red
        break
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: event.resource.status === 'CLOSED' ? '4px' : '8px',
        opacity: event.resource.status === 'CLOSED' ? 0.8 : 0.95,
        color: 'white',
        border: '2px solid white',
        display: 'flex',
        flexDirection: 'column' as const,
        fontSize: '13px',
        padding: '6px 8px',
        fontWeight: event.resource.status === 'CLOSED' ? '600' : '500',
        lineHeight: '1.3',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        cursor,
      },
    }
  }

  // Når man klikker på en event
  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource.status === 'CLOSED') {
      return
    }
    window.location.href = `/admin/bestillinger/${event.resource.id}`
  }

  // Når man klikker på en ledig tid
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot({
      date: slotInfo.start,
      time: slotInfo.start,
    })
    setQuickBookingOpen(true)
  }

  // Custom event-wrapper for bedre visning av overlappende events
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const hours = Math.floor(event.resource.duration / 60)
    const minutes = event.resource.duration % 60
    const timeStr = hours > 0 ? `${hours}t${minutes > 0 ? ` ${minutes}m` : ''}` : `${minutes}m`
    
    return (
      <div className="flex flex-col h-full justify-between" style={{ minHeight: '50px' }}>
        <div>
          <div className="font-bold truncate text-white" style={{ fontSize: '13px' }}>
            {event.resource.customerName}
          </div>
          <div className="text-white/90 text-xs truncate">
            {event.resource.vehicleCount} kjøretøy
          </div>
        </div>
        <div className="text-white/80 text-xs font-medium">
          {timeStr} • kr {event.resource.totalPrice.toLocaleString('nb-NO')}
        </div>
      </div>
    )
  }

  const messages = {
    allDay: 'Hele dagen',
    previous: 'Forrige',
    next: 'Neste',
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
  }

  return (
    <div className="space-y-4">
      {/* Forklaring av farger */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md border-2 border-white shadow-sm" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-sm font-medium text-gray-700">Bekreftet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md border-2 border-white shadow-sm" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-sm font-medium text-gray-700">Pågår</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md border-2 border-white shadow-sm" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-sm font-medium text-gray-700">Fullført</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md border-2 border-white shadow-sm" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm font-medium text-gray-700">Ikke møtt opp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border-2 border-white shadow-sm" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-sm font-medium text-gray-700">Stengt dag</span>
          </div>
        </div>
      </Card>

      {/* Kalender */}
      <Card className="p-6">
        <div style={{ height: '800px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent as any,
            }}
            messages={messages}
            views={['month', 'week', 'day']}
            view={view}
            onView={(newView) => setView(newView as 'month' | 'week' | 'day')}
            popup
            selectable
            step={30}
            timeslots={2}
            min={calendarMinTime}
            max={calendarMaxTime}
            dayLayoutAlgorithm="no-overlap"
          />
        </div>
      </Card>

      {/* Quick Booking Dialog */}
      <QuickBookingDialog
        open={quickBookingOpen}
        onOpenChange={setQuickBookingOpen}
        selectedDate={selectedSlot?.date || null}
        selectedTime={selectedSlot?.time || null}
      />
    </div>
  )
}

