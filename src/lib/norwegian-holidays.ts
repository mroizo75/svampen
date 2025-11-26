interface Holiday {
  date: Date
  name: string
  isRecurring: boolean
}

function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  
  // Bruk middag (12:00) for å unngå timezone-problemer
  return new Date(year, month - 1, day, 12, 0, 0)
}

export function getNorwegianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = []
  
  const easterSunday = getEasterSunday(year)
  
  // Bruk middag (12:00) for å unngå timezone-problemer
  holidays.push({
    date: new Date(year, 0, 1, 12, 0, 0),
    name: '1. nyttårsdag',
    isRecurring: true,
  })
  
  const maundyThursday = new Date(easterSunday.getTime())
  maundyThursday.setDate(easterSunday.getDate() - 3)
  holidays.push({
    date: maundyThursday,
    name: 'Skjærtorsdag',
    isRecurring: true,
  })
  
  const goodFriday = new Date(easterSunday.getTime())
  goodFriday.setDate(easterSunday.getDate() - 2)
  holidays.push({
    date: goodFriday,
    name: 'Langfredag',
    isRecurring: true,
  })
  
  holidays.push({
    date: new Date(easterSunday.getTime()),
    name: '1. påskedag',
    isRecurring: true,
  })
  
  const easterMonday = new Date(easterSunday.getTime())
  easterMonday.setDate(easterSunday.getDate() + 1)
  holidays.push({
    date: easterMonday,
    name: '2. påskedag',
    isRecurring: true,
  })
  
  holidays.push({
    date: new Date(year, 4, 1, 12, 0, 0),
    name: 'Arbeidernes dag',
    isRecurring: true,
  })
  
  holidays.push({
    date: new Date(year, 4, 17, 12, 0, 0),
    name: '17. mai',
    isRecurring: true,
  })
  
  const ascensionDay = new Date(easterSunday.getTime())
  ascensionDay.setDate(easterSunday.getDate() + 39)
  holidays.push({
    date: ascensionDay,
    name: 'Kristi himmelfartsdag',
    isRecurring: true,
  })
  
  const whitSunday = new Date(easterSunday.getTime())
  whitSunday.setDate(easterSunday.getDate() + 49)
  holidays.push({
    date: whitSunday,
    name: '1. pinsedag',
    isRecurring: true,
  })
  
  const whitMonday = new Date(easterSunday.getTime())
  whitMonday.setDate(easterSunday.getDate() + 50)
  holidays.push({
    date: whitMonday,
    name: '2. pinsedag',
    isRecurring: true,
  })
  
  holidays.push({
    date: new Date(year, 11, 25, 12, 0, 0),
    name: '1. juledag',
    isRecurring: true,
  })
  
  holidays.push({
    date: new Date(year, 11, 26, 12, 0, 0),
    name: '2. juledag',
    isRecurring: true,
  })
  
  return holidays
}

export function isNorwegianHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const holidays = getNorwegianHolidays(date.getFullYear())
  
  const holiday = holidays.find(h => {
    return h.date.getDate() === date.getDate() &&
           h.date.getMonth() === date.getMonth() &&
           h.date.getFullYear() === date.getFullYear()
  })
  
  if (holiday) {
    return { isHoliday: true, name: holiday.name }
  }
  
  return { isHoliday: false }
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

