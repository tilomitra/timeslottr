import type { Timeslot, TimeslotGenerationConfig } from './types.js';
import { calendarFromDateValue } from './internal/time.js';
import { resolveRange, type BoundaryContext } from './internal/boundaries.js';
import { normalizeExclusions, subtractExclusions } from './internal/exclusions.js';
import { validateConfig } from './internal/config.js';
import { addMinutes, generateSlotsForSegment } from './internal/slots.js';

export function generateTimeslots(config: TimeslotGenerationConfig): Timeslot[] {
  const normalized = validateConfig(config);

  const defaultCalendarDate = config.day ? calendarFromDateValue(config.day, config.timezone) : undefined;
  const rangeContext: BoundaryContext = {
    timeZone: config.timezone,
    defaultCalendarDate
  };

  const range = resolveRange(config.range, rangeContext);

  let windowStart = range.start;
  let windowEnd = range.end;

  if (config.bufferBeforeMinutes) {
    windowStart = addMinutes(windowStart, config.bufferBeforeMinutes);
  }
  if (config.bufferAfterMinutes) {
    windowEnd = addMinutes(windowEnd, -config.bufferAfterMinutes);
  }

  if (windowEnd.getTime() <= windowStart.getTime()) {
    throw new RangeError('Buffers eliminate the available window; adjust buffer values.');
  }

  const exclusions = normalizeExclusions(config.excludedWindows, rangeContext, { start: windowStart, end: windowEnd });
  const baseSegments = subtractExclusions({ start: windowStart, end: windowEnd }, exclusions);

  const slots: Timeslot[] = [];
  for (const segment of baseSegments) {
    if (normalized.maxSlots !== undefined && slots.length >= normalized.maxSlots) {
      break;
    }
    generateSlotsForSegment(slots, segment, normalized);
  }

  return slots;
}
