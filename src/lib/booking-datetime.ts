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

export function isBeforeToday(date: Date): boolean {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return date < startOfToday
}
