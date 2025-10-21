'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, CalendarPlus, Download } from 'lucide-react'
import {
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  generateOffice365Url,
  downloadICalFile,
} from '@/lib/calendar-utils'

interface AddToCalendarProps {
  booking: {
    scheduledDate: string
    scheduledTime: string
    estimatedEnd: string
    totalDuration: number
    bookingVehicles: Array<{
      vehicleType: { name: string }
      bookingServices: Array<{
        service: { name: string }
      }>
    }>
    user: {
      firstName: string
      lastName: string
    }
  }
  bookingId: string
}

export function AddToCalendar({ booking, bookingId }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Prepare event data
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

  // Generate title and description
  const vehiclesList = booking.bookingVehicles
    .map(v => {
      const services = v.bookingServices.map(s => s.service.name).join(', ')
      return `${v.vehicleType.name}: ${services}`
    })
    .join('\n')

  const title = `Svampen - ${booking.bookingVehicles[0]?.vehicleType.name || 'Booking'}`
  const description = `Bestilling hos Svampen\n\nBestillingsnummer: #${bookingId.substring(0, 8)}\n\nTjenester:\n${vehiclesList}\n\nVarighet: ${Math.floor(booking.totalDuration / 60)}t ${booking.totalDuration % 60}min\n\nKontakt: joachim@amento.no eller 38 34 74 70`
  const location = 'Svampen - Adresse her' // Update with actual address

  const event = {
    title,
    description,
    location,
    startTime,
    endTime,
  }

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event)
    window.open(url, '_blank')
    setIsOpen(false)
  }

  const handleOutlook = () => {
    const url = generateOutlookUrl(event)
    window.open(url, '_blank')
    setIsOpen(false)
  }

  const handleOffice365 = () => {
    const url = generateOffice365Url(event)
    window.open(url, '_blank')
    setIsOpen(false)
  }

  const handleAppleCalendar = () => {
    downloadICalFile(event, `svampen-booking-${bookingId.substring(0, 8)}.ics`)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          <CalendarPlus className="mr-2 h-5 w-5" />
          Legg til i kalender
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Velg kalender</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGoogleCalendar} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAppleCalendar} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Outlook.com
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOffice365} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Office 365
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

