import { OSLO_TIME_ZONE, osloParts } from './booking-datetime'

// Utility functions for generating calendar links

interface CalendarEvent {
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
}

// Generate Google Calendar URL
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Generate iCal file content (for Apple Calendar, Outlook, etc.)
function formatOsloIcal(date: Date): string {
  const parts = osloParts(date)
  const month = String(parts.month).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')
  const hour = String(parts.hour).padStart(2, '0')
  const minute = String(parts.minute).padStart(2, '0')
  return `${parts.year}${month}${day}T${hour}${minute}00`
}

export function generateICalContent(event: CalendarEvent): string {
  const formatStamp = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '')
  }

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Svampen//Booking System//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${OSLO_TIME_ZONE}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `DTSTART;TZID=${OSLO_TIME_ZONE}:${formatOsloIcal(event.startTime)}`,
    `DTEND;TZID=${OSLO_TIME_ZONE}:${formatOsloIcal(event.endTime)}`,
    `DTSTAMP:${formatStamp(new Date())}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return ical
}

// Generate Outlook.com URL
export function generateOutlookUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString()
  }

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: formatDate(event.startTime),
    enddt: formatDate(event.endTime),
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Generate Office 365 URL
export function generateOffice365Url(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString()
  }

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: formatDate(event.startTime),
    enddt: formatDate(event.endTime),
  })

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Download iCal file
export function downloadICalFile(event: CalendarEvent, filename: string = 'booking.ics') {
  const icalContent = generateICalContent(event)
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

