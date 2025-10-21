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
export function generateICalContent(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '')
  }

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Svampen//Booking System//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `DTSTAMP:${formatDate(new Date())}`,
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

