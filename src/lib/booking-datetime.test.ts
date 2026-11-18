import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  calendarDateKey,
  isBookingOnCalendarDay,
  isSameCalendarDate,
  isSameWallClockTime,
  localDateTimeFromKeys,
  osloDateTimeFromKeys,
  osloTimeKey,
  slotOverlapsBooking,
  utcMidnightFromDateKey,
  wallClockTimeKey,
} from './booking-datetime'

describe('booking datetime', () => {
  it('treats the local calendar day as unchanged when the client sends that day', () => {
    const stored = new Date(2026, 10, 20, 1, 0, 0, 0)

    assert.equal(calendarDateKey(stored), '2026-11-20')
    assert.equal(isSameCalendarDate(stored, '2026-11-20'), true)
    assert.equal(isSameCalendarDate(stored, '2026-11-21'), false)
  })

  it('stores a picked date at UTC midnight and a picked time as Norwegian wall clock', () => {
    const date = utcMidnightFromDateKey('2026-11-21')
    const winter = localDateTimeFromKeys('2026-11-21', '09:30')
    const summer = osloDateTimeFromKeys('2026-07-21', '12:30')

    assert.equal(date.toISOString(), '2026-11-21T00:00:00.000Z')
    assert.equal(winter.toISOString(), '2026-11-21T08:30:00.000Z')
    assert.equal(summer.toISOString(), '2026-07-21T10:30:00.000Z')
    assert.equal(wallClockTimeKey(winter), '09:30')
    assert.equal(osloTimeKey(summer), '12:30')
    assert.equal(isSameWallClockTime(winter, '09:30'), true)
    assert.equal(isSameWallClockTime(winter, '10:00'), false)
  })

  it('keeps a booking on the calendar day whether the date was stored at UTC or local midnight', () => {
    const utcMidnight = new Date(Date.UTC(2026, 10, 20, 0, 0, 0, 0))
    const localMidnight = new Date(2026, 10, 20, 0, 0, 0, 0)
    const nextLocalMidnight = new Date(2026, 10, 21, 0, 0, 0, 0)

    assert.equal(isBookingOnCalendarDay(utcMidnight, 2026, 10, 20), true)
    assert.equal(isBookingOnCalendarDay(localMidnight, 2026, 10, 20), true)
    assert.equal(isBookingOnCalendarDay(nextLocalMidnight, 2026, 10, 20), false)
  })

  it('blocks the same Norwegian wall-clock time', () => {
    const stored = osloDateTimeFromKeys('2026-11-20', '12:30')

    assert.equal(slotOverlapsBooking({
      scheduledTime: stored,
      totalDuration: 60,
      slotStartMinutes: 12 * 60 + 30,
      slotDurationMinutes: 60,
    }), true)
    assert.equal(slotOverlapsBooking({
      scheduledTime: stored,
      totalDuration: 60,
      slotStartMinutes: 13 * 60 + 30,
      slotDurationMinutes: 60,
    }), false)
  })
})
