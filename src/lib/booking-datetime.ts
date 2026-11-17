export function calendarDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function wallClockTimeKey(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
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
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hours, minutes] = timeKey.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function ensureSelectedTime(times: string[], selectedTime: string): string[] {
  if (!selectedTime || times.includes(selectedTime)) {
    return times
  }
  return [...times, selectedTime].sort()
}

export function isBookingOnCalendarDay(scheduledDate: Date, year: number, monthIndex: number, day: number): boolean {
  const utcMatch = scheduledDate.getUTCFullYear() === year
    && scheduledDate.getUTCMonth() === monthIndex
    && scheduledDate.getUTCDate() === day
  const localMatch = scheduledDate.getFullYear() === year
    && scheduledDate.getMonth() === monthIndex
    && scheduledDate.getDate() === day

  if (localMatch && !utcMatch) return true
  if (utcMatch && !localMatch) {
    return scheduledDate.getUTCHours() === 0 && scheduledDate.getUTCMinutes() === 0
  }
  return utcMatch && localMatch
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
  const bookingStart = input.scheduledTime.getUTCHours() * 60 + input.scheduledTime.getUTCMinutes()
  const bookingEnd = bookingStart + input.totalDuration
  const slotEnd = input.slotStartMinutes + input.slotDurationMinutes
  return input.slotStartMinutes < bookingEnd && slotEnd > bookingStart
}

export function isBeforeToday(date: Date): boolean {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return date < startOfToday
}
