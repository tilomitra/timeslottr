import type { Interval, Timeslot, TimeslotGenerationConfig, TimeslotRangeInput } from './types.js';
import { mergeIntervals } from './internal/exclusions.js';
import { resolveRange, type BoundaryContext } from './internal/boundaries.js';
import { runSlotGeneration } from './internal/slots.js';
import { prepareTimeslotGeneration } from './generate-timeslots.js';

/**
 * Configuration for {@link generateAvailableTimeslots}. Extends the standard
 * {@link TimeslotGenerationConfig} with booked time to subtract before slotting.
 */
export interface AvailableTimeslotConfig extends TimeslotGenerationConfig {
  /**
   * Booked events to remove from the base availability — the shared bookings
   * that block everyone (e.g. an existing meeting on the host's calendar).
   * Accepts the same flexible boundary formats as `range`/`excludedWindows`.
   */
  busy?: TimeslotRangeInput[];
  /**
   * Per-participant busy sets. When provided, the resulting slots are the
   * windows where *every* participant is free — `base − busy`, then intersected
   * across participants. An empty inner array means that participant is free
   * for the whole window. Omit entirely for single-calendar availability.
   */
  participantsBusy?: TimeslotRangeInput[][];
}

function cloneInterval(interval: Interval): Interval {
  return { start: new Date(interval.start.getTime()), end: new Date(interval.end.getTime()) };
}

function resolveIntervals(inputs: TimeslotRangeInput[] | undefined, context: BoundaryContext): Interval[] {
  if (!inputs || inputs.length === 0) {
    return [];
  }
  return inputs.map((input) => resolveRange(input, context));
}

/**
 * Remove a set of `busy` intervals from a set of `source` (available)
 * intervals, returning the remaining free time as half-open `[start, end)`
 * intervals.
 *
 * Busy intervals may be unsorted, overlap each other, touch boundaries, or
 * fully cover / split a source interval. A busy window landing in the middle of
 * a source splits it into two.
 *
 * This is the "availability − bookings = free time" primitive.
 *
 * Runs in `O((n + m) log m)` — busy is sorted+merged once, then both lists are
 * swept with a single two-pointer pass (no nested `n * m` scan).
 *
 * @param source available intervals to subtract from
 * @param busy   busy intervals to remove
 */
export function subtract(source: Interval[], busy: Interval[]): Interval[] {
  if (source.length === 0) {
    return [];
  }

  const sortedSource = [...source].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Sort + merge busy once so the sweep never re-examines an interval.
  const merged = mergeIntervals(busy);
  if (merged.length === 0) {
    return sortedSource.filter((src) => src.end.getTime() > src.start.getTime()).map(cloneInterval);
  }
  const result: Interval[] = [];
  let busyIndex = 0;

  for (const src of sortedSource) {
    let cursor = src.start.getTime();
    const srcEnd = src.end.getTime();
    if (srcEnd <= cursor) {
      continue;
    }

    // Skip busy intervals that end before this source begins. Safe to advance
    // the shared pointer because sources are processed in start order.
    while (busyIndex < merged.length && merged[busyIndex]!.end.getTime() <= cursor) {
      busyIndex += 1;
    }

    let k = busyIndex;
    while (k < merged.length && merged[k]!.start.getTime() < srcEnd) {
      const bStart = merged[k]!.start.getTime();
      const bEnd = merged[k]!.end.getTime();

      if (bStart > cursor) {
        result.push({ start: new Date(cursor), end: new Date(bStart) });
      }
      if (bEnd > cursor) {
        cursor = bEnd;
      }
      if (cursor >= srcEnd) {
        break;
      }
      k += 1;
    }

    if (cursor < srcEnd) {
      result.push({ start: new Date(cursor), end: new Date(srcEnd) });
    }
  }

  return result;
}

/**
 * Given N sets of free intervals (one set per person), return the windows where
 * *all* sets overlap simultaneously — the times that work for the whole team.
 *
 * Boundary-touching intervals do not count as overlap (half-open `[start, end)`
 * semantics, consistent with the rest of the library).
 *
 * Edge cases:
 * - `0` sets → `[]`
 * - `1` set → a merged copy of that set
 * - any empty set → `[]` (someone with no availability blocks everyone)
 *
 * Runs in `O(total intervals * log)` — each set is sorted+merged, then folded
 * pairwise with a linear two-pointer sweep (no pairwise nested loops).
 *
 * @param intervalSets one free-interval set per participant
 */
export function intersect(intervalSets: Interval[][]): Interval[] {
  if (intervalSets.length === 0) {
    return [];
  }

  const normalized = intervalSets.map((set) => mergeIntervals(set));
  if (normalized.some((set) => set.length === 0)) {
    return [];
  }

  let common: Interval[] = normalized[0]!.map(cloneInterval);

  for (let i = 1; i < normalized.length; i += 1) {
    if (common.length === 0) {
      return [];
    }

    const other = normalized[i]!;
    const out: Interval[] = [];
    let a = 0;
    let b = 0;

    while (a < common.length && b < other.length) {
      const aStart = common[a]!.start.getTime();
      const aEnd = common[a]!.end.getTime();
      const bStart = other[b]!.start.getTime();
      const bEnd = other[b]!.end.getTime();

      const start = Math.max(aStart, bStart);
      const end = Math.min(aEnd, bEnd);
      if (start < end) {
        out.push({ start: new Date(start), end: new Date(end) });
      }

      // Advance whichever interval ends first.
      if (aEnd <= bEnd) {
        a += 1;
      } else {
        b += 1;
      }
    }

    common = out;
  }

  return common;
}

/**
 * Generate bookable timeslots from a base availability window after removing
 * booked time and (optionally) narrowing to times that work for every
 * participant.
 *
 * Pipeline: resolve the base availability (range − buffers − excludedWindows)
 * → {@link subtract} `busy` → {@link intersect} across `participantsBusy` when
 * provided → run the **existing** slot generator over the remaining free
 * intervals. Slotting behavior (duration, interval, alignment, buffers,
 * labels, `maxSlots`, timezone/DST handling) is identical to
 * `generateTimeslots`.
 *
 * @param config the standard generation config plus `busy` / `participantsBusy`
 */
export function generateAvailableTimeslots(config: AvailableTimeslotConfig): Timeslot[] {
  const { busy, participantsBusy, ...generationConfig } = config;
  const { normalized, context, segments } = prepareTimeslotGeneration(generationConfig);

  // availability − shared bookings
  let free = subtract(segments, resolveIntervals(busy, context));

  // narrow to windows where every participant is also free
  if (participantsBusy && participantsBusy.length > 0) {
    const participantFreeSets = participantsBusy.map((personBusy) =>
      subtract(free, resolveIntervals(personBusy, context))
    );
    free = intersect(participantFreeSets);
  }

  return runSlotGeneration(free, normalized);
}
