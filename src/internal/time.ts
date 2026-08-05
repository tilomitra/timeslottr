import type { DateValue, TimeOfDayInput } from '../types.js';
import { MILLIS_PER_MINUTE } from './constants.js';

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type TimeOfDay = {
  hour: number;
  minute: number;
  second: number;
};

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

function isTimeOfDayObject(value: unknown): value is { hour: number; minute?: number; second?: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hour' in value &&
    typeof (value as { hour: unknown }).hour === 'number'
  );
}

export function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function isTimeOnlyString(value: string): boolean {
  return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value.trim());
}

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dateTimeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    dateTimeFormatters.set(timeZone, formatter);
  }

  return formatter;
}

function getCalendarFromParts(parts: Intl.DateTimeFormatPart[]): CalendarDate & TimeOfDay {
  const map = new Map<string, string>();
  for (const part of parts) {
    if (part.type !== 'literal') {
      map.set(part.type, part.value);
    }
  }

  const year = Number(map.get('year'));
  const month = Number(map.get('month'));
  const day = Number(map.get('day'));
  const hour = Number(map.get('hour'));
  const minute = Number(map.get('minute'));
  const second = Number(map.get('second'));

  if ([year, month, day, hour, minute, second].some((num) => Number.isNaN(num))) {
    throw new Error('Unable to derive date parts from Intl.DateTimeFormat');
  }

  return { year, month, day, hour, minute, second };
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const formatter = getDateTimeFormatter(timeZone);
  const { year, month, day, hour, minute, second } = getCalendarFromParts(formatter.formatToParts(date));
  const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asUTC - date.getTime()) / MILLIS_PER_MINUTE;
}

function zonedTimeToUtc(calendar: CalendarDate, time: TimeOfDay, timeZone: string): Date {
  const utcDate = new Date(Date.UTC(calendar.year, calendar.month - 1, calendar.day, time.hour, time.minute, time.second));
  const offset = getTimeZoneOffset(utcDate, timeZone);
  const adjusted = new Date(utcDate.getTime() - offset * MILLIS_PER_MINUTE);
  const offsetAfter = getTimeZoneOffset(adjusted, timeZone);
  if (offset !== offsetAfter) {
    return new Date(utcDate.getTime() - offsetAfter * MILLIS_PER_MINUTE);
  }
  return adjusted;
}

/**
 * Break an instant down into its wall-clock date *and* time in `timeZone`
 * (local time when no zone is given). The inverse of
 * {@link makeDateFromCalendarAndTime}.
 */
export function toZonedDateTimeFromInstant(date: Date, timeZone?: string): CalendarDate & TimeOfDay {
  if (timeZone) {
    const formatter = getDateTimeFormatter(timeZone);
    return getCalendarFromParts(formatter.formatToParts(date));
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds()
  };
}

export function toCalendarDateFromInstant(date: Date, timeZone?: string): CalendarDate {
  const { year, month, day } = toZonedDateTimeFromInstant(date, timeZone);
  return { year, month, day };
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Length of a 1-indexed month, accounting for leap years. */
function daysInMonth(year: number, month: number): number {
  return month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1]!;
}

export function calendarFromDateOnlyString(value: string): CalendarDate {
  const trimmed = value.trim();
  if (!isDateOnlyString(trimmed)) {
    throw new TypeError(`Invalid date string: ${value}`);
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    throw new RangeError(`Month out of range in date string: ${value}`);
  }
  // Bound by the real length of the month. A day of 1–31 alone lets a date like
  // 2025-02-30 through, which then rolls over into March — an exclusion written
  // for it would silently apply to the wrong day, or to no day at all.
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`Day out of range in date string: ${value}`);
  }

  return { year, month, day };
}

export function addDaysToCalendar(date: CalendarDate, days: number): CalendarDate {
  const nextDate = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate()
  };
}

/**
 * Parse a free-form string into an instant, leaving the actual parsing to the
 * engine.
 *
 * Strings that carry no time are rejected rather than parsed. The engine
 * resolves a zoneless string against the *system* zone, not the configured
 * `timezone`, so `"2025-3-5"` becomes local midnight and then reads back as the
 * 4th or the 5th depending on where the code runs. Date-only values have an
 * unambiguous path already — the strict `YYYY-MM-DD` form — so point callers at
 * it instead of silently resolving to the wrong day.
 */
export function parseInstantFromString(value: string, label: string): Date {
  const trimmed = value.trim();
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(`Invalid ${label} string: ${value}`);
  }

  if (!/\d:\d/.test(trimmed)) {
    throw new TypeError(
      `Ambiguous ${label} string: ${value}. Write a date-only value as YYYY-MM-DD, ` +
      'which is interpreted in the configured timezone, or include an explicit time.'
    );
  }

  return parsed;
}

export function calendarFromDateValue(value: DateValue, timeZone?: string): CalendarDate {
  if (isDate(value)) {
    return toCalendarDateFromInstant(new Date(value.getTime()), timeZone);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isDateOnlyString(trimmed)) {
      return calendarFromDateOnlyString(trimmed);
    }

    return toCalendarDateFromInstant(parseInstantFromString(value, 'date'), timeZone);
  }

  throw new TypeError('Unsupported date value');
}

export function parseDateValue(value: DateValue, timeZone?: string, treatDateOnlyAsLocalMidnight = false): Date {
  if (isDate(value)) {
    const time = value.getTime();
    if (Number.isNaN(time)) {
      throw new TypeError('Invalid date provided');
    }
    return new Date(time);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isDateOnlyString(trimmed) || treatDateOnlyAsLocalMidnight) {
      const calendar = calendarFromDateOnlyString(trimmed);
      return makeDateFromCalendarAndTime(calendar, { hour: 0, minute: 0, second: 0 }, timeZone);
    }

    return parseInstantFromString(value, 'date');
  }

  throw new TypeError('Unsupported date value');
}

export function parseTimeOfDay(input: TimeOfDayInput): TimeOfDay {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = /^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(trimmed);
    if (!match) {
      throw new TypeError(`Invalid time string: ${input}`);
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = match[3] ? Number(match[3]) : 0;

    if (hour < 0 || hour > 23) {
      throw new RangeError(`Hour out of range in time string: ${input}`);
    }
    if (minute < 0 || minute > 59) {
      throw new RangeError(`Minute out of range in time string: ${input}`);
    }
    if (second < 0 || second > 59) {
      throw new RangeError(`Second out of range in time string: ${input}`);
    }

    return { hour, minute, second };
  }

  if (isTimeOfDayObject(input)) {
    const { hour, minute = 0, second = 0 } = input;
    if (hour < 0 || hour > 23) {
      throw new RangeError(`Hour out of range: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new RangeError(`Minute out of range: ${minute}`);
    }
    if (second < 0 || second > 59) {
      throw new RangeError(`Second out of range: ${second}`);
    }

    return { hour, minute, second };
  }

  throw new TypeError('Unsupported time input');
}

export function makeDateFromCalendarAndTime(calendar: CalendarDate, time: TimeOfDay, timeZone?: string): Date {
  if (timeZone) {
    return zonedTimeToUtc(calendar, time, timeZone);
  }
  return new Date(calendar.year, calendar.month - 1, calendar.day, time.hour, time.minute, time.second, 0);
}
