import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  calendarDateKey,
  isBookingOnCalendarDay,
  isSameCalendarDate,
  isSameWallClockTime,
  localDateTimeFromKeys,
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

  it('stores a picked date at UTC midnight and a picked time in local wall clock', () => {
    const date = utcMidnightFromDateKey('2026-11-21')
    const time = localDateTimeFromKeys('2026-11-21', '09:30')

    assert.equal(date.toISOString(), '2026-11-21T00:00:00.000Z')
    assert.equal(wallClockTimeKey(time), '09:30')
    assert.equal(isSameWallClockTime(time, '09:30'), true)
    assert.equal(isSameWallClockTime(time, '10:00'), false)
  })

  it('keeps a booking on the calendar day whether the date was stored at UTC or local midnight', () => {
    const utcMidnight = new Date(Date.UTC(2026, 10, 20, 0, 0, 0, 0))
    const localMidnight = new Date(2026, 10, 20, 0, 0, 0, 0)
    const nextLocalMidnight = new Date(2026, 10, 21, 0, 0, 0, 0)

    assert.equal(isBookingOnCalendarDay(utcMidnight, 2026, 10, 20), true)
    assert.equal(isBookingOnCalendarDay(localMidnight, 2026, 10, 20), true)
    assert.equal(isBookingOnCalendarDay(nextLocalMidnight, 2026, 10, 20), false)
  })

  it('blocks the same wall-clock time even when the stored instant is one hour off local time', () => {
    const storedAtUtcWallClock = new Date(Date.UTC(2026, 10, 20, 9, 0, 0, 0))
    const proposedShifted = new Date(Date.UTC(2026, 10, 20, 8, 0, 0, 0))
    const oldComparisonOverlaps = proposedShifted < new Date(storedAtUtcWallClock.getTime() + 60 * 60000)
      && new Date(proposedShifted.getTime() + 60 * 60000) > storedAtUtcWallClock

    assert.equal(oldComparisonOverlaps, false)
    assert.equal(slotOverlapsBooking({
      scheduledTime: storedAtUtcWallClock,
      totalDuration: 60,
      slotStartMinutes: 9 * 60,
      slotDurationMinutes: 60,
    }), true)
    assert.equal(slotOverlapsBooking({
      scheduledTime: storedAtUtcWallClock,
      totalDuration: 60,
      slotStartMinutes: 10 * 60,
      slotDurationMinutes: 60,
    }), false)
    assert.equal(slotOverlapsBooking({
      scheduledTime: new Date('1970-01-01T09:00:00.000Z'),
      totalDuration: 60,
      slotStartMinutes: 9 * 60,
      slotDurationMinutes: 30,
    }), true)
  })
})
