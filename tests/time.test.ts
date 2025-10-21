import { describe, expect, it } from 'vitest';
import {
  isDateOnlyString,
  isTimeOnlyString,
  calendarFromDateOnlyString,
  calendarFromDateValue,
  parseDateValue,
  parseTimeOfDay,
  makeDateFromCalendarAndTime,
  toCalendarDateFromInstant
} from '../src/internal/time.js';

describe('isDateOnlyString', () => {
  it('returns true for valid date-only strings', () => {
    expect(isDateOnlyString('2024-01-01')).toBe(true);
    expect(isDateOnlyString('2024-12-31')).toBe(true);
    expect(isDateOnlyString(' 2024-06-15 ')).toBe(true);
  });

  it('returns false for non-date strings', () => {
    expect(isDateOnlyString('2024-01-01T10:00:00Z')).toBe(false);
    expect(isDateOnlyString('10:00')).toBe(false);
    expect(isDateOnlyString('invalid')).toBe(false);
    expect(isDateOnlyString('2024-1-1')).toBe(false);
  });
});

describe('isTimeOnlyString', () => {
  it('returns true for valid time-only strings', () => {
    expect(isTimeOnlyString('09:00')).toBe(true);
    expect(isTimeOnlyString('23:59')).toBe(true);
    expect(isTimeOnlyString('09:00:30')).toBe(true);
    expect(isTimeOnlyString(' 10:30 ')).toBe(true);
  });

  it('returns false for non-time strings', () => {
    expect(isTimeOnlyString('2024-01-01')).toBe(false);
    expect(isTimeOnlyString('2024-01-01T10:00:00Z')).toBe(false);
    expect(isTimeOnlyString('invalid')).toBe(false);
  });

  it('accepts single digit hours', () => {
    expect(isTimeOnlyString('9:00')).toBe(true); // single digit hour is valid
  });
});

describe('calendarFromDateOnlyString', () => {
  it('parses valid date strings', () => {
    expect(calendarFromDateOnlyString('2024-01-15')).toEqual({ year: 2024, month: 1, day: 15 });
    expect(calendarFromDateOnlyString('2024-12-31')).toEqual({ year: 2024, month: 12, day: 31 });
  });

  it('throws for invalid date format', () => {
    expect(() => calendarFromDateOnlyString('2024-1-1')).toThrow(TypeError);
    expect(() => calendarFromDateOnlyString('invalid')).toThrow(TypeError);
  });

  it('throws for out of range month', () => {
    expect(() => calendarFromDateOnlyString('2024-00-01')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('2024-13-01')).toThrow(RangeError);
  });

  it('throws for out of range day', () => {
    expect(() => calendarFromDateOnlyString('2024-01-00')).toThrow(RangeError);
    expect(() => calendarFromDateOnlyString('2024-01-32')).toThrow(RangeError);
  });
});

describe('parseTimeOfDay', () => {
  it('parses time strings without seconds', () => {
    expect(parseTimeOfDay('09:00')).toEqual({ hour: 9, minute: 0, second: 0 });
    expect(parseTimeOfDay('23:59')).toEqual({ hour: 23, minute: 59, second: 0 });
  });

  it('parses time strings with seconds', () => {
    expect(parseTimeOfDay('09:00:30')).toEqual({ hour: 9, minute: 0, second: 30 });
    expect(parseTimeOfDay('23:59:59')).toEqual({ hour: 23, minute: 59, second: 59 });
  });

  it('parses time objects', () => {
    expect(parseTimeOfDay({ hour: 9, minute: 30 })).toEqual({ hour: 9, minute: 30, second: 0 });
    expect(parseTimeOfDay({ hour: 9, minute: 30, second: 45 })).toEqual({ hour: 9, minute: 30, second: 45 });
  });

  it('throws for invalid time strings', () => {
    expect(() => parseTimeOfDay('invalid')).toThrow(TypeError);
    expect(() => parseTimeOfDay('25:00')).toThrow(RangeError);
    expect(() => parseTimeOfDay('09:60')).toThrow(RangeError);
    expect(() => parseTimeOfDay('09:00:60')).toThrow(RangeError);
  });

  it('throws for out of range time values in objects', () => {
    expect(() => parseTimeOfDay({ hour: 24, minute: 0 })).toThrow(RangeError);
    expect(() => parseTimeOfDay({ hour: -1, minute: 0 })).toThrow(RangeError);
    expect(() => parseTimeOfDay({ hour: 9, minute: 60 })).toThrow(RangeError);
    expect(() => parseTimeOfDay({ hour: 9, minute: 0, second: 60 })).toThrow(RangeError);
  });
});

describe('parseDateValue', () => {
  it('parses Date objects', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const result = parseDateValue(date);
    expect(result.toISOString()).toBe(date.toISOString());
  });

  it('throws for invalid Date objects', () => {
    const invalidDate = new Date('invalid');
    expect(() => parseDateValue(invalidDate)).toThrow(TypeError);
  });

  it('parses date-only strings', () => {
    const result = parseDateValue('2024-01-01');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January is 0
    expect(result.getDate()).toBe(1);
  });

  it('parses ISO date-time strings', () => {
    const result = parseDateValue('2024-01-01T10:00:00Z');
    expect(result.toISOString()).toBe('2024-01-01T10:00:00.000Z');
  });

  it('throws for invalid strings', () => {
    expect(() => parseDateValue('invalid')).toThrow(TypeError);
  });
});

describe('calendarFromDateValue', () => {
  it('extracts calendar from Date object', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const result = calendarFromDateValue(date, 'UTC');
    expect(result).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('parses date-only strings', () => {
    const result = calendarFromDateValue('2024-06-15');
    expect(result).toEqual({ year: 2024, month: 6, day: 15 });
  });

  it('handles timezone offsets for Date objects', () => {
    const date = new Date('2024-01-01T23:00:00Z');
    const result = calendarFromDateValue(date, 'America/New_York');
    expect(result).toEqual({ year: 2024, month: 1, day: 1 });
  });
});

describe('makeDateFromCalendarAndTime', () => {
  it('creates Date from calendar and time in UTC', () => {
    const calendar = { year: 2024, month: 1, day: 15 };
    const time = { hour: 10, minute: 30, second: 0 };
    const result = makeDateFromCalendarAndTime(calendar, time, 'UTC');
    expect(result.toISOString()).toBe('2024-01-15T10:30:00.000Z');
  });

  it('creates Date from calendar and time in local timezone when no timezone provided', () => {
    const calendar = { year: 2024, month: 1, day: 15 };
    const time = { hour: 10, minute: 30, second: 0 };
    const result = makeDateFromCalendarAndTime(calendar, time);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January is 0
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(30);
  });

  it('handles DST transitions', () => {
    // Summer time in New York (EDT)
    const summerCalendar = { year: 2024, month: 6, day: 15 };
    const time = { hour: 9, minute: 0, second: 0 };
    const summerResult = makeDateFromCalendarAndTime(summerCalendar, time, 'America/New_York');
    expect(summerResult.toISOString()).toBe('2024-06-15T13:00:00.000Z');

    // Winter time in New York (EST)
    const winterCalendar = { year: 2024, month: 1, day: 15 };
    const winterResult = makeDateFromCalendarAndTime(winterCalendar, time, 'America/New_York');
    expect(winterResult.toISOString()).toBe('2024-01-15T14:00:00.000Z');
  });
});

describe('toCalendarDateFromInstant', () => {
  it('extracts calendar date in UTC', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const result = toCalendarDateFromInstant(date, 'UTC');
    expect(result).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('extracts calendar date in specific timezone', () => {
    const date = new Date('2024-01-15T05:00:00Z'); // 5 AM UTC
    const result = toCalendarDateFromInstant(date, 'America/New_York'); // Should be Jan 15 in NY
    expect(result).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('handles date boundary crossings', () => {
    const date = new Date('2024-01-15T02:00:00Z'); // 2 AM UTC
    const result = toCalendarDateFromInstant(date, 'America/Los_Angeles'); // Should be Jan 14 in LA
    expect(result).toEqual({ year: 2024, month: 1, day: 14 });
  });

  it('uses local timezone when none provided', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const result = toCalendarDateFromInstant(date);
    expect(result.year).toBe(2024);
    expect(result.month).toBe(6);
  });
});
