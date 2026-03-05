import type { 
  Timeslot, 
  TimeslotGenerationConfig, 
  TimeslotRangeInput, 
  TimeslotBoundaryInput
} from './types.js';
import { generateTimeslots } from './generate-timeslots.js';
import { resolveRange, type BoundaryContext } from './internal/boundaries.js';

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

export interface DailyTimeslotConfig
  extends Omit<TimeslotGenerationConfig, 'day' | 'range'> {
  range: TimeslotRangeInput | WeekdayTimeslotRangeInput;
  /** Hard cap on the number of calendar days to iterate. Defaults to 10 000. */
  maxDays?: number;
}

export function generateDailyTimeslots(
  period: TimeslotRangeInput,
  config: DailyTimeslotConfig
): Timeslot[] {
  const periodContext: BoundaryContext = {
    timeZone: config.timezone,
  };

  const periodRange = resolveRange(period, periodContext);
  const start = periodRange.start;
  const end = periodRange.end;

  const maxDays = config.maxDays ?? DEFAULT_MAX_DAYS;
  if (maxDays <= 0) {
    throw new RangeError('maxDays must be a positive number');
  }

  const { range: configRange, maxDays: _, ...baseConfig } = config;

  const results: Timeslot[] = [];
  let daysCount = 0;

  const iterator = new Date(start);

  while (iterator <= end) {
    if (daysCount++ > maxDays) {
      throw new RangeError(
        `generateDailyTimeslots exceeded maximum day limit (${maxDays}). ` +
        'Pass a smaller period or increase maxDays.'
      );
    }

    const day = new Date(iterator);

    let currentRange: TimeslotRangeInput | null = null;
    if (configRange instanceof Map) {
      currentRange = configRange.get(day.getDay()) ?? null;
    } else {
      currentRange = configRange;
    }

    if (currentRange) {
      const daySlots = generateTimeslots({
        ...baseConfig,
        range: currentRange,
        day,
      });

      for (const slot of daySlots) {
        if (slot.start >= start && slot.end <= end) {
          results.push(slot);
        }
      }
    }

    iterator.setDate(iterator.getDate() + 1);
  }

  return results;
}
