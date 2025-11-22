import type { Timeslot, TimeslotGenerationConfig, TimeslotRangeInput } from './types.js';
import { generateTimeslots } from './generate-timeslots.js';
import { resolveRange, type BoundaryContext } from './internal/boundaries.js';

export function generateDailyTimeslots(
  period: TimeslotRangeInput,
  config: Omit<TimeslotGenerationConfig, 'day' | 'range'> & { range: TimeslotRangeInput }
): Timeslot[] {
  const periodContext: BoundaryContext = {
    timeZone: config.timezone,
  };

  const periodRange = resolveRange(period, periodContext);
  const start = periodRange.start;
  const end = periodRange.end;

  // DEBUG
  console.log('generateDailyTimeslots period:', start.toISOString(), 'to', end.toISOString());

  const results: Timeslot[] = [];
  const MAX_DAYS = 10000;
  let daysCount = 0;

  const iterator = new Date(start);

  while (iterator <= end) {
    if (daysCount++ > MAX_DAYS) {
      throw new RangeError('generateDailyTimeslots exceeded maximum day limit (10000)');
    }

    console.log('Iterating day:', iterator.toISOString());

    const daySlots = generateTimeslots({
      ...config,
      day: new Date(iterator),
    });

    for (const slot of daySlots) {
      if (slot.start >= start && slot.end <= end) {
        results.push(slot);
      }
    }

    iterator.setDate(iterator.getDate() + 1);
  }

  return results;
}
