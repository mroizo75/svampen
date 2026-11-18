export const OSLO_TIME_ZONE = 'Europe/Oslo'

type OsloParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export function osloParts(value: Date): OsloParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: OSLO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const raw = parts.find((part) => part.type === type)?.value ?? '0'
    return Number(raw)
  }
  const hour = read('hour')
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: hour === 24 ? 0 : hour,
    minute: read('minute'),
  }
}

export function osloDateKey(value: Date): string {
  const parts = osloParts(value)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function osloTimeKey(value: Date): string {
  const parts = osloParts(value)
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
}

export function osloDateTimeFromKeys(dateKey: string, timeKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute] = timeKey.split(':').map(Number)
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  const shown = osloParts(guess)
  const wanted = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  const actual = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, 0, 0)
  return new Date(guess.getTime() - (actual - wanted))
}

export function osloWallClockDate(value: Date): Date {
  const parts = osloParts(value)
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
}

export function formatOsloDate(value: Date): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: OSLO_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value)
}

export function formatOsloLongDate(value: Date): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: OSLO_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value)
}

export function formatOsloDateTime(dateValue: Date, timeValue: Date = dateValue): string {
  return `${formatOsloDate(dateValue)} kl. ${osloTimeKey(timeValue)}`
}

export function calendarDateKey(value: Date): string {
  return osloDateKey(value)
}

export function wallClockTimeKey(value: Date): string {
  return osloTimeKey(value)
}

export function isSameCalendarDate(stored: Date, incomingDate: string): boolean {
  return calendarDateKey(stored) === incomingDate
}

export function isSameWallClockTime(stored: Date, incomingTime: string): boolean {
  return wallClockTimeKey(stored) === incomingTime
}

export function utcMidnightFromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

export function localDateTimeFromKeys(dateKey: string, timeKey: string): Date {
  return osloDateTimeFromKeys(dateKey, timeKey)
}

export function ensureSelectedTime(times: string[], selectedTime: string): string[] {
  if (!selectedTime || times.includes(selectedTime)) {
    return times
  }
  return [...times, selectedTime].sort()
}

export function isBookingOnCalendarDay(scheduledDate: Date, year: number, monthIndex: number, day: number): boolean {
  const month = String(monthIndex + 1).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return osloDateKey(scheduledDate) === `${year}-${month}-${dayText}`
}

export function calendarDayQueryRange(year: number, monthIndex: number, day: number): { gte: Date; lte: Date } {
  return {
    gte: new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - 14 * 60 * 60 * 1000),
    lte: new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999)),
  }
}

export function slotOverlapsBooking(input: {
  scheduledTime: Date
  totalDuration: number
  slotStartMinutes: number
  slotDurationMinutes: number
}): boolean {
  const parts = osloParts(input.scheduledTime)
  const bookingStart = parts.hour * 60 + parts.minute
  const bookingEnd = bookingStart + input.totalDuration
  const slotEnd = input.slotStartMinutes + input.slotDurationMinutes
  return input.slotStartMinutes < bookingEnd && slotEnd > bookingStart
}

export function isBeforeToday(date: Date): boolean {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return date < startOfToday
}
