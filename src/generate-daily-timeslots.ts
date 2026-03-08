import type { 
  Timeslot, 
  TimeslotGenerationConfig, 
  TimeslotRangeInput,
} from './types.js';
import { generateTimeslots } from './generate-timeslots.js';
import { resolveBoundary, type BoundaryContext } from './internal/boundaries.js';
import { 
  CalendarDate,
  addDaysToCalendar,
  makeDateFromCalendarAndTime,
  calendarFromDateValue,
} from './internal/time.js';

/**
 * Default maximum number of days to iterate over.
 * Prevents runaway loops when the period is unreasonably large.
 */
const DEFAULT_MAX_DAYS = 10_000;

export enum Weekday {
  SUN, // js Date.getDay starts with sunday
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT,
};

export type WeekdayTimeslotRangeInput = Map<Weekday, TimeslotRangeInput | null>;
export type DateTimeslotRangeInput = Map<CalendarDate | string, TimeslotRangeInput[]>;

export interface DailyTimeslotConfig
  extends Omit<TimeslotGenerationConfig, 'day' | 'range' | 'excludedWindows'> {
  range: TimeslotRangeInput | WeekdayTimeslotRangeInput;
  excludedWindows?: TimeslotRangeInput[] | DateTimeslotRangeInput;
  /** Hard cap on the number of calendar days to iterate. Defaults to 10 000. */
  maxDays?: number;
}

function calendarToString(calendar: CalendarDate): string {
  return `${calendar.year}-${calendar.month.toString().padStart(2, '0')}-${calendar.day.toString().padStart(2, '0')}`;
}

export function generateDailyTimeslots(
  period: TimeslotRangeInput,
  config: DailyTimeslotConfig
): Timeslot[] {
  const periodContext: BoundaryContext = {
    timeZone: config.timezone,
  };

  const startResolved = resolveBoundary(period.start, periodContext);
  const endResolved = resolveBoundary(period.end, {
    ...periodContext,
    defaultCalendarDate: startResolved.calendar
  });

  const start = startResolved.instant;
  const end = endResolved.instant;

  const maxDays = config.maxDays ?? DEFAULT_MAX_DAYS;
  if (maxDays <= 0) {
    throw new RangeError('maxDays must be a positive number');
  }

  const { range: configRange, maxDays: _, excludedWindows, ...baseConfig } = config;

  const results: Timeslot[] = [];
  let daysCount = 0;

  let currentCalendar = { ...startResolved.calendar };

  while (true) {
    if (daysCount++ > maxDays) {
      throw new RangeError(
        `generateDailyTimeslots exceeded maximum day limit (${maxDays}). ` +
        'Pass a smaller period or increase maxDays.'
      );
    }

    // Check if the current day starts before or at the end of the period.
    const currentDayStart = makeDateFromCalendarAndTime(
      currentCalendar,
      { hour: 0, minute: 0, second: 0 },
      config.timezone
    );

    if (currentDayStart > end) {
      break;
    }

    let currentExclusions: TimeslotRangeInput[] | null | undefined = null;
    if (excludedWindows instanceof Map) {
      currentExclusions = excludedWindows.get(currentCalendar) 
        ?? excludedWindows.get(calendarToString(currentCalendar));
    } else {
      currentExclusions = excludedWindows;
    }

    let currentRange: TimeslotRangeInput | null = null;
    if (configRange instanceof Map) {
      // Use a timezone-aware day of week.
      const utcDay = new Date(Date.UTC(currentCalendar.year, currentCalendar.month - 1, currentCalendar.day)).getUTCDay();
      currentRange = configRange.get(utcDay as Weekday) ?? null;
    } else {
      currentRange = configRange;
    }

    if (currentRange) {
      const daySlots = generateTimeslots({
        ...baseConfig,
        range: currentRange,
        excludedWindows: currentExclusions,
        day: makeDateFromCalendarAndTime(currentCalendar, { hour: 12, minute: 0, second: 0 }, config.timezone),
      });

      for (const slot of daySlots) {
        if (slot.start >= start && slot.end <= end) {
          results.push(slot);
        }
      }
    }

    currentCalendar = addDaysToCalendar(currentCalendar, 1);
  }

  return results;
}
