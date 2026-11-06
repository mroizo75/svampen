import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  calendarDateKey,
  isSameCalendarDate,
  isSameWallClockTime,
  localDateTimeFromKeys,
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
})
