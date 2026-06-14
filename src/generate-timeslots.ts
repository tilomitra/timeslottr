import type { Interval, Timeslot, TimeslotGenerationConfig } from './types.js';
import { calendarFromDateValue } from './internal/time.js';
import { resolveRange, type BoundaryContext } from './internal/boundaries.js';
import { normalizeExclusions, subtractExclusions } from './internal/exclusions.js';
import { validateConfig, type NormalizedConfig } from './internal/config.js';
import { addMinutes, runSlotGeneration } from './internal/slots.js';

export interface PreparedGeneration {
  /** Validated/normalized slotting config. */
  normalized: NormalizedConfig;
  /** Boundary-resolution context (timezone + default day) for the config. */
  context: BoundaryContext;
  /**
   * Base availability segments after applying buffers and excluded windows,
   * before any slotting. Ordered and non-overlapping.
   */
  segments: Interval[];
}

/**
 * Resolve a config down to its base availability segments without slotting.
 *
 * This is the shared front half of `generateTimeslots`: it validates the
 * config, resolves the range against the timezone/day context, applies
 * buffers, and subtracts excluded windows. `generateAvailableTimeslots` reuses
 * it so the two entry points stay in lock-step.
 */
export function prepareTimeslotGeneration(config: TimeslotGenerationConfig): PreparedGeneration {
  const normalized = validateConfig(config);

  const defaultCalendarDate = config.day ? calendarFromDateValue(config.day, config.timezone) : undefined;
  const context: BoundaryContext = {
    timeZone: config.timezone,
    defaultCalendarDate
  };

  const range = resolveRange(config.range, context);

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

  const exclusions = normalizeExclusions(config.excludedWindows, context, { start: windowStart, end: windowEnd });
  const segments = subtractExclusions({ start: windowStart, end: windowEnd }, exclusions);

  return { normalized, context, segments };
}

export function generateTimeslots(config: TimeslotGenerationConfig): Timeslot[] {
  const { normalized, segments } = prepareTimeslotGeneration(config);
  return runSlotGeneration(segments, normalized);
}
