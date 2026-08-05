import { describe, expect, it } from 'vitest';
import { generateTimeslots } from '../src/index.js';
import { resolveBoundary } from '../src/internal/boundaries.js';
import {
  calendarFromDateOnlyString,
  calendarFromDateValue,
  parseDateValue
} from '../src/internal/time.js';

/**
 * Both suites below guard the same failure mode: a date input that resolves to
 * the wrong day without complaining. An exclusion written for a day that never
 * gets matched silently doesn't apply, so the slot it was meant to block stays
 * bookable.
 */

describe('calendarFromDateOnlyString – days beyond the length of the month', () => {
  it('rejects a day that does not exist in that month', () => {
    expect(() => calendarFromDateOnlyString('2025-02-30')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('2025-04-31')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('2025-06-31')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('2025-09-31')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('2025-11-31')).toThrow(RangeError);
  });

  it('applies the full leap-year rule to 29 February', () => {
    expect(calendarFromDateOnlyString('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(calendarFromDateOnlyString('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 });

    expect(() => calendarFromDateOnlyString('2025-02-29')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('1900-02-29')).toThrow(RangeError);
  });

  it('still accepts the last real day of each month', () => {
    expect(calendarFromDateOnlyString('2025-01-31')).toEqual({ year: 2025, month: 1, day: 31 });
    expect(calendarFromDateOnlyString('2025-02-28')).toEqual({ year: 2025, month: 2, day: 28 });
    expect(calendarFromDateOnlyString('2025-04-30')).toEqual({ year: 2025, month: 4, day: 30 });
  });

  it('rejects an exclusion dated to a day that does not exist', () => {
    // Previously this rolled over to 2 March, matched nothing, and returned the
    // full unexcluded day.
    expect(() =>
      generateTimeslots({
        range: { start: '09:00', end: '17:00' },
        slotDurationMinutes: 60,
        timezone: 'Asia/Tokyo',
        day: '2025-02-28',
        excludedWindows: [
          { start: { date: '2025-02-30', time: '09:00' }, end: { date: '2025-02-30', time: '12:00' } }
        ]
      })
    ).toThrow(RangeError);
  });
});

describe('date strings that carry no time', () => {
  it('rejects loose date-only forms rather than resolving them in the system zone', () => {
    expect(() => calendarFromDateValue('2025-3-5', 'Pacific/Honolulu')).toThrow(TypeError);
    expect(() => calendarFromDateValue('2025/03/05', 'Pacific/Honolulu')).toThrow(TypeError);
    expect(() => parseDateValue('2025-3-5', 'Pacific/Honolulu')).toThrow(TypeError);
    expect(() => resolveBoundary('2025/03/05', { timeZone: 'Pacific/Honolulu' })).toThrow(TypeError);
  });

  it('names the strict form in the error', () => {
    expect(() => calendarFromDateValue('2025-3-5')).toThrow(/Ambiguous date string/);
    expect(() => calendarFromDateValue('2025-3-5')).toThrow(/YYYY-MM-DD/);
  });

  it('keeps reporting unparseable strings as invalid, not ambiguous', () => {
    expect(() => calendarFromDateValue('not a date')).toThrow(/Invalid date string/);
    expect(() => resolveBoundary('not a date', {})).toThrow(/Invalid boundary string/);
  });

  it('still accepts the strict form and anything carrying an explicit time', () => {
    expect(calendarFromDateValue('2025-03-05', 'Pacific/Honolulu')).toEqual({ year: 2025, month: 3, day: 5 });
    expect(calendarFromDateValue('2025-03-05T09:00:00Z', 'UTC')).toEqual({ year: 2025, month: 3, day: 5 });
    expect(calendarFromDateValue('2025-03-05 09:00', 'UTC')).toEqual({ year: 2025, month: 3, day: 5 });
    expect(calendarFromDateValue(new Date('2025-03-05T09:00:00Z'), 'UTC')).toEqual({ year: 2025, month: 3, day: 5 });
  });

  it('resolves the strict form against the configured zone, not the system one', () => {
    for (const timeZone of ['Pacific/Honolulu', 'UTC', 'Asia/Tokyo', 'America/New_York']) {
      expect(calendarFromDateValue('2025-03-05', timeZone)).toEqual({ year: 2025, month: 3, day: 5 });
    }
  });

  it('rejects an exclusion dated with a loose string', () => {
    // Previously this landed on 4 March in a zone west of the system zone,
    // matched nothing, and left all eight slots bookable.
    expect(() =>
      generateTimeslots({
        range: { start: '09:00', end: '17:00' },
        slotDurationMinutes: 60,
        timezone: 'Pacific/Honolulu',
        day: '2025-03-05',
        excludedWindows: [
          { start: { date: '2025-3-5', time: '09:00' }, end: { date: '2025-3-5', time: '12:00' } }
        ]
      })
    ).toThrow(TypeError);
  });

  it('applies the equivalent exclusion written in the strict form', () => {
    const slots = generateTimeslots({
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      timezone: 'Pacific/Honolulu',
      day: '2025-03-05',
      excludedWindows: [
        { start: { date: '2025-03-05', time: '09:00' }, end: { date: '2025-03-05', time: '12:00' } }
      ]
    });

    expect(slots).toHaveLength(5);
  });
});
