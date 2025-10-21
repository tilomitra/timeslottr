import type { TimeslotBoundaryInput, TimeslotRangeInput } from '../types.js';
import {
  type CalendarDate,
  makeDateFromCalendarAndTime,
  parseDateValue,
  parseTimeOfDay,
  calendarFromDateOnlyString,
  calendarFromDateValue,
  isDateOnlyString,
  isTimeOnlyString,
  toCalendarDateFromInstant
} from './time.js';

export interface BoundaryContext {
  timeZone?: string;
  defaultCalendarDate?: CalendarDate;
}

export interface ResolvedBoundary {
  instant: Date;
  calendar: CalendarDate;
}

export function resolveBoundary(input: TimeslotBoundaryInput, context: BoundaryContext): ResolvedBoundary {
  const { timeZone, defaultCalendarDate } = context;

  if (input instanceof Date) {
    const instant = parseDateValue(input, timeZone);
    return { instant, calendar: toCalendarDateFromInstant(instant, timeZone) };
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (isTimeOnlyString(trimmed)) {
      if (!defaultCalendarDate) {
        throw new RangeError(`Time-only boundary "${input}" requires a default day (use config.day or provide a date).`);
      }
      const time = parseTimeOfDay(trimmed);
      const instant = makeDateFromCalendarAndTime(defaultCalendarDate, time, timeZone);
      return { instant, calendar: defaultCalendarDate };
    }

    if (isDateOnlyString(trimmed)) {
      const calendar = calendarFromDateOnlyString(trimmed);
      const instant = makeDateFromCalendarAndTime(calendar, { hour: 0, minute: 0, second: 0 }, timeZone);
      return { instant, calendar };
    }

    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const instant = new Date(normalized);
    if (Number.isNaN(instant.getTime())) {
      throw new TypeError(`Invalid boundary string: ${input}`);
    }
    return { instant, calendar: toCalendarDateFromInstant(instant, timeZone) };
  }

  if (typeof input === 'object' && input !== null && 'time' in input) {
    const time = parseTimeOfDay(input.time);
    const calendar = input.date
      ? calendarFromDateValue(input.date, timeZone)
      : defaultCalendarDate;

    if (!calendar) {
      throw new RangeError('Time boundary requires a date when no default day is provided.');
    }

    const instant = makeDateFromCalendarAndTime(calendar, time, timeZone);
    return { instant, calendar };
  }

  throw new TypeError('Unsupported boundary input');
}

export function resolveRange(range: TimeslotRangeInput, context: BoundaryContext): { start: Date; end: Date } {
  const startResolved = resolveBoundary(range.start, context);
  const endResolved = resolveBoundary(range.end, {
    ...context,
    defaultCalendarDate: startResolved.calendar ?? context.defaultCalendarDate
  });

  if (endResolved.instant.getTime() <= startResolved.instant.getTime()) {
    throw new RangeError('Timeslot range end must be after its start');
  }

  return { start: startResolved.instant, end: endResolved.instant };
}
