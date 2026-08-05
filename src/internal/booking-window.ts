import type { TimeslotGenerationConfig } from '../types.js';
import { MILLIS_PER_MINUTE } from './constants.js';
import {
  addDaysToCalendar,
  makeDateFromCalendarAndTime,
  parseDateValue,
  toZonedDateTimeFromInstant
} from './time.js';

/**
 * The span in which a slot is allowed to *start*, derived from
 * `minimumNoticeMinutes` / `maximumAdvanceDays` relative to `now`.
 *
 * Half-open `[earliestStartMs, latestStartMs)`, consistent with the rest of the
 * library. Either bound may be infinite when only one option is configured.
 */
export interface BookingWindow {
  /** Earliest instant a slot may start (inclusive). */
  earliestStartMs: number;
  /** Latest instant a slot may start (exclusive). */
  latestStartMs: number;
}

/**
 * Shift an instant by whole calendar days while keeping the same wall-clock
 * time in `timeZone`. Going through the calendar rather than adding
 * `days * 24h` keeps "14 days from now" at the same local time across a DST
 * transition.
 */
function addCalendarDays(instant: Date, days: number, timeZone?: string): Date {
  const zoned = toZonedDateTimeFromInstant(instant, timeZone);
  const calendar = addDaysToCalendar(zoned, days);
  return makeDateFromCalendarAndTime(
    calendar,
    { hour: zoned.hour, minute: zoned.minute, second: zoned.second },
    timeZone
  );
}

/**
 * Resolve the booking-notice options into a concrete start window, or
 * `undefined` when neither option is configured (in which case `now` is never
 * read and generation stays a pure function of the range).
 */
export function resolveBookingWindow(config: TimeslotGenerationConfig): BookingWindow | undefined {
  const { minimumNoticeMinutes, maximumAdvanceDays } = config;

  if (minimumNoticeMinutes === undefined && maximumAdvanceDays === undefined) {
    return undefined;
  }

  if (
    minimumNoticeMinutes !== undefined &&
    (!Number.isFinite(minimumNoticeMinutes) || minimumNoticeMinutes < 0)
  ) {
    throw new RangeError('minimumNoticeMinutes must be a non-negative number');
  }

  if (
    maximumAdvanceDays !== undefined &&
    (!Number.isInteger(maximumAdvanceDays) || maximumAdvanceDays <= 0)
  ) {
    throw new RangeError('maximumAdvanceDays must be a positive whole number of days');
  }

  const now = config.now === undefined ? new Date() : parseDateValue(config.now, config.timezone);

  const earliestStartMs =
    minimumNoticeMinutes === undefined
      ? Number.NEGATIVE_INFINITY
      : now.getTime() + minimumNoticeMinutes * MILLIS_PER_MINUTE;

  const latestStartMs =
    maximumAdvanceDays === undefined
      ? Number.POSITIVE_INFINITY
      : addCalendarDays(now, maximumAdvanceDays, config.timezone).getTime();

  if (earliestStartMs >= latestStartMs) {
    throw new RangeError(
      'minimumNoticeMinutes and maximumAdvanceDays leave no bookable window; adjust the values.'
    );
  }

  return { earliestStartMs, latestStartMs };
}
